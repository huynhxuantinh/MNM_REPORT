import { spawn } from "node:child_process";
import http from "node:http";
import net from "node:net";
import path from "node:path";
import { fileURLToPath } from "node:url";

const mode = process.argv[2] ?? "run";
const rawArgs = process.argv.slice(3);
const strictFlag = rawArgs.includes("--strict");
const fallbackFlag = rawArgs.includes("--allow-fallback");
const extraArgs = rawArgs.filter((arg) => arg !== "--strict" && arg !== "--allow-fallback");
const strictMode = strictFlag || process.env.CYPRESS_STRICT === "1";
const skipVerify = process.env.CYPRESS_SKIP_VERIFY === "true" || process.env.SKIP_CYPRESS_VERIFY === "1";
const env = Object.fromEntries(
  Object.entries(process.env).filter(([, value]) => value !== undefined),
);

delete env.ELECTRON_RUN_AS_NODE;
delete process.env.ELECTRON_RUN_AS_NODE;

const HOST = "127.0.0.1";
const START_PORT = 5173;
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const FRONTEND_ROOT = path.resolve(__dirname, "..");
const CYPRESS_BIN = path.join(FRONTEND_ROOT, "node_modules", "cypress", "bin", "cypress");
const NPM_BIN = process.platform === "win32" ? "npm.cmd" : "npm";

const runNodeScript = (scriptPath, args, options = {}) =>
  new Promise((resolve) => {
    const childProcess = spawn(process.execPath, [scriptPath, ...args], {
      stdio: "inherit",
      env,
      cwd: FRONTEND_ROOT,
      ...options,
    });
    childProcess.on("exit", (code) => resolve(code ?? 1));
  });

const findAvailablePort = async (port, maxTries = 20) => {
  const canUsePort = (candidate) =>
    new Promise((resolve) => {
      const server = net.createServer();
      server.once("error", () => resolve(false));
      server.once("listening", () => {
        server.close(() => resolve(true));
      });
      server.listen(candidate, HOST);
    });

  for (let offset = 0; offset < maxTries; offset += 1) {
    const candidate = port + offset;
    // eslint-disable-next-line no-await-in-loop
    const isFree = await canUsePort(candidate);
    if (isFree) return candidate;
  }
  throw new Error(`Cannot find available port from ${port} to ${port + maxTries - 1}`);
};

const waitForServer = (url, timeoutMs = 60_000) => new Promise((resolve, reject) => {
  const startedAt = Date.now();

  const probe = () => {
    const req = http.get(url, (res) => {
      res.resume();
      if (res.statusCode && res.statusCode < 500) {
        resolve();
      } else if (Date.now() - startedAt > timeoutMs) {
        reject(new Error(`Server responded with ${res.statusCode} until timeout`));
      } else {
        setTimeout(probe, 700);
      }
    });

    req.on("error", () => {
      if (Date.now() - startedAt > timeoutMs) {
        reject(new Error("Timed out waiting for Vite server"));
      } else {
        setTimeout(probe, 700);
      }
    });
  };

  probe();
});

let child;
let devServer;

const stopDevServer = () => {
  if (devServer && !devServer.killed) {
    devServer.kill("SIGTERM");
  }
};

const maybeRunFallback = () =>
  new Promise((resolve) => {
    const allowFallback = !strictMode && (fallbackFlag || env.ALLOW_CYPRESS_FALLBACK === "1");
    if (!allowFallback) {
      resolve(1);
      return;
    }
    console.warn("[run-cypress] Cypress failed, fallback to Playwright admin smoke...");
    const fallback = spawn(NPM_BIN, ["run", "pw:admin"], {
      stdio: "inherit",
      env,
      cwd: FRONTEND_ROOT,
      shell: process.platform === "win32",
    });
    fallback.on("exit", (fallbackCode) => resolve(fallbackCode ?? 1));
  });

Promise.resolve(skipVerify ? 0 : runNodeScript(CYPRESS_BIN, ["verify"]))
  .then((verifyCode) => {
    if (skipVerify) {
      console.warn("[run-cypress] Skip Cypress verify via env (CYPRESS_SKIP_VERIFY/SKIP_CYPRESS_VERIFY).");
    }
    if (verifyCode !== 0) {
      throw new Error("Cypress verify failed. Please ensure local Cypress runtime is healthy.");
    }
    return findAvailablePort(START_PORT);
  })
  .then((port) => {
    const appUrl = `http://${HOST}:${port}`;
    devServer = spawn(
      NPM_BIN,
      ["run", "dev", "--", "--host", HOST, "--port", String(port), "--strictPort"],
      {
      stdio: "inherit",
      env,
      cwd: FRONTEND_ROOT,
      shell: process.platform === "win32",
      },
    );

    return waitForServer(appUrl).then(() => ({ appUrl, port }));
  })
  .then(({ appUrl }) => {
    const cypressArgs = [mode, "--config", `baseUrl=${appUrl}`, ...extraArgs];
    child = spawn(process.execPath, [CYPRESS_BIN, ...cypressArgs], {
      stdio: "inherit",
      env,
      cwd: FRONTEND_ROOT,
    });

    child.on("exit", async (code) => {
      stopDevServer();
      if (code === 0 || mode !== "run" || strictMode) {
        process.exit(code ?? 1);
      }
      const fallbackCode = await maybeRunFallback();
      process.exit(fallbackCode);
    });
  })
  .catch(async (err) => {
    console.error(`[run-cypress] ${err.message}`);
    stopDevServer();
    if (mode === "run" && !strictMode && (fallbackFlag || env.ALLOW_CYPRESS_FALLBACK === "1")) {
      const fallbackCode = await maybeRunFallback();
      process.exit(fallbackCode);
      return;
    }
    process.exit(1);
  });

process.on("exit", () => stopDevServer());
process.on("SIGINT", () => {
  stopDevServer();
  process.exit(130);
});
