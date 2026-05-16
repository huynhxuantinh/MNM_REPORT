import { spawn } from "node:child_process";

const mode = process.argv[2] ?? "run";
const env = Object.fromEntries(
  Object.entries(process.env).filter(([, value]) => value !== undefined),
);

delete env.ELECTRON_RUN_AS_NODE;

const child = spawn(`npx cypress ${mode}`, {
  stdio: "inherit",
  shell: true,
  env,
});

child.on("exit", (code) => {
  process.exit(code ?? 1);
});
