import { createServer } from "vite";
import { startContentWatcher } from "./watch-content.mjs";

const args = process.argv.slice(2);
const portArg = args.indexOf("--port");
const port = Number(
  portArg >= 0 ? args[portArg + 1] : (process.env.PORT ?? 3000),
);
const watcher = await startContentWatcher({ prefix: "[content]" });
const server = await createServer({ server: { port, host: "127.0.0.1" } });
const cleanup = async () => {
  watcher.close();
  await server.close();
  process.exit(0);
};
for (const signal of ["SIGINT", "SIGTERM", "SIGHUP"])
  process.on(signal, cleanup);
await server.listen();
server.printUrls();
