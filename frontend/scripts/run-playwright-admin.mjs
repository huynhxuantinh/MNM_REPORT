import { spawn } from "node:child_process";
import http from "node:http";
import net from "node:net";

const HOST = "127.0.0.1";
const START_PORT = 5182;

const env = Object.fromEntries(
  Object.entries(process.env).filter(([, value]) => value !== undefined),
);

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

let devServer;
let child;

const stopDevServer = () => {
  if (devServer && !devServer.killed) {
    devServer.kill("SIGTERM");
  }
};

findAvailablePort(START_PORT)
  .then((port) => {
    const appUrl = `http://${HOST}:${port}`;
    const devCommand = `npm.cmd run dev -- --host ${HOST} --port ${port} --strictPort`;

    env.PLAYWRIGHT_BASE_URL = appUrl;

    devServer = spawn(devCommand, {
      stdio: "inherit",
      shell: true,
      env,
    });

    return waitForServer(appUrl).then(() => appUrl);
  })
  .then(() => {
    child = spawn("npx playwright test tests/admin.smoke.spec.js", {
      stdio: "inherit",
      shell: true,
      env,
    });

    child.on("exit", (code) => {
      stopDevServer();
      process.exit(code ?? 1);
    });
  })
  .catch((err) => {
    console.error(`[run-playwright-admin] ${err.message}`);
    stopDevServer();
    process.exit(1);
  });

process.on("exit", () => stopDevServer());
process.on("SIGINT", () => {
  stopDevServer();
  process.exit(130);
});

