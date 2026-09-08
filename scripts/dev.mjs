import { spawn } from "node:child_process";
import { createRequire } from "node:module";
import { startContentWatcher } from "./watch-content.mjs";

const require = createRequire(import.meta.url);
const nextBin = require.resolve("next/dist/bin/next");

const rawArgs = process.argv.slice(2);
let nextArgs = [];
if (rawArgs.length === 0) {
  nextArgs = ["dev", "--turbopack"];
} else if (rawArgs[0] === "dev") {
  nextArgs = rawArgs;
} else {
  nextArgs = ["dev", "--turbopack", ...rawArgs];
}

const watcher = startContentWatcher({ prefix: "\x1b[36m[content]\x1b[0m" });

const nextProcess = spawn(process.execPath, [nextBin, ...nextArgs], {
  stdio: "inherit",
  shell: false,
  env: process.env,
});

let isCleaningUp = false;
const cleanup = (exitCode = 0) => {
  if (isCleaningUp) return;
  isCleaningUp = true;
  watcher.close();
  if (nextProcess && !nextProcess.killed) {
    try {
      nextProcess.kill("SIGINT");
    } catch {
      // Ignore if process already exited
    }
  }
  process.exit(exitCode);
};

process.on("SIGINT", () => cleanup(0));
process.on("SIGTERM", () => cleanup(0));
process.on("SIGHUP", () => cleanup(0));

nextProcess.on("exit", (code) => {
  watcher.close();
  process.exit(code ?? 0);
});

nextProcess.on("error", (err) => {
  console.error("Failed to start Next.js process:", err);
  cleanup(1);
});
