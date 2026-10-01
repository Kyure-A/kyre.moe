import { spawn } from "node:child_process";
import { createRequire } from "node:module";
import { dirname, join } from "node:path";
import { startContentWatcher } from "./watch-content.mjs";

const require = createRequire(import.meta.url);
const rshonoBin = join(
  dirname(require.resolve("@rshono/core/package.json")),
  "bin",
  "rshono.mjs",
);
const rawArgs = process.argv.slice(2);
const rshonoArgs = rawArgs[0] === "dev" ? rawArgs.slice(1) : rawArgs;
let watcher = null;
let rshonoProcess = null;
let isCleaningUp = false;

const cleanup = (exitCode = 0) => {
  if (isCleaningUp) return;
  isCleaningUp = true;
  watcher?.close();
  if (rshonoProcess && !rshonoProcess.killed) rshonoProcess.kill("SIGINT");
  process.exit(exitCode);
};

process.on("SIGINT", () => cleanup(0));
process.on("SIGTERM", () => cleanup(0));
process.on("SIGHUP", () => cleanup(0));

try {
  watcher = await startContentWatcher({ prefix: "\x1b[36m[content]\x1b[0m" });
  rshonoProcess = spawn(process.execPath, [rshonoBin, "dev", ...rshonoArgs], {
    stdio: "inherit",
    shell: false,
    env: process.env,
  });
  rshonoProcess.on("exit", (code) => {
    watcher.close();
    process.exit(code ?? 0);
  });
  rshonoProcess.on("error", (error) => {
    console.error("Failed to start rshono:", error);
    cleanup(1);
  });
} catch (error) {
  console.error("Failed to prepare development content:", error);
  cleanup(1);
}
