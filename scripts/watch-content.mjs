import { spawn } from "node:child_process";
import { createHash } from "node:crypto";
import fs from "node:fs";
import { createRequire } from "node:module";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { copyBlogImages } from "./copy-blog-images.mjs";
import { exportOrg } from "./export-org.mjs";

const require = createRequire(import.meta.url);
const ARTICLES_DIR = path.join(process.cwd(), "articles");
const PREPARE_SCRIPT = fileURLToPath(
  new URL("./prepare-content.ts", import.meta.url),
);
const IMAGE_EXTENSIONS = new Set([
  ".png",
  ".jpg",
  ".jpeg",
  ".gif",
  ".webp",
  ".svg",
]);

function isIgnored(filename) {
  if (!filename) return true;
  return filename
    .split(path.sep)
    .some(
      (segment) =>
        segment.startsWith(".") ||
        segment.startsWith("#") ||
        segment.endsWith("~"),
    );
}

function markdownSignature(filePath) {
  try {
    return createHash("sha256").update(fs.readFileSync(filePath)).digest("hex");
  } catch (error) {
    if (error.code === "ENOENT") return "missing";
    throw error;
  }
}

export async function startContentWatcher(options = {}) {
  const { prefix = "[content]" } = options;
  const log = (...args) => console.log(prefix, ...args);
  let timer = null;
  let running = false;
  let closed = false;
  let prepareProcess = null;
  let pending = { org: false, markdown: false, images: false };
  const generatedMarkdown = new Map();

  const prepare = () =>
    new Promise((resolve, reject) => {
      const tsxBin = require.resolve("tsx/cli");
      const child = spawn(process.execPath, [tsxBin, PREPARE_SCRIPT], {
        stdio: "inherit",
        shell: false,
        env: process.env,
      });
      prepareProcess = child;
      child.once("error", reject);
      child.once("exit", (code, signal) => {
        prepareProcess = null;
        if (code === 0) resolve();
        else
          reject(new Error(`Content preparation failed (${signal ?? code}).`));
      });
    });

  const sync = async ({ org, images }) => {
    if (org) {
      for (const filePath of exportOrg()) {
        const absolutePath = path.resolve(process.cwd(), filePath);
        generatedMarkdown.set(absolutePath, markdownSignature(absolutePath));
      }
    }
    if (images) copyBlogImages();
    await prepare();
  };

  const scheduleFlush = () => {
    if (closed) return;
    if (timer) clearTimeout(timer);
    timer = setTimeout(flush, 150);
  };

  const flush = async () => {
    timer = null;
    if (closed || running) return;
    const changes = pending;
    pending = { org: false, markdown: false, images: false };
    running = true;
    log("Rebuilding changed content...");
    try {
      await sync(changes);
    } catch (error) {
      console.error(prefix, error);
    } finally {
      running = false;
      if (pending.org || pending.markdown || pending.images) scheduleFlush();
    }
  };

  log("Performing initial content sync...");
  await sync({ org: true, images: true });

  if (!fs.existsSync(ARTICLES_DIR)) {
    console.error(prefix, `Articles directory not found: ${ARTICLES_DIR}`);
    return { close: () => {} };
  }

  const watcher = fs.watch(
    ARTICLES_DIR,
    { recursive: true },
    (_eventType, filename) => {
      if (!filename || isIgnored(filename)) return;
      const extension = path.extname(filename).toLowerCase();
      if (extension === ".org") {
        pending.org = true;
      } else if (extension === ".md" || extension === ".mdx") {
        const filePath = path.join(ARTICLES_DIR, filename);
        if (generatedMarkdown.get(filePath) === markdownSignature(filePath))
          return;
        pending.markdown = true;
      } else if (IMAGE_EXTENSIONS.has(extension)) {
        pending.images = true;
      } else {
        return;
      }
      scheduleFlush();
    },
  );

  log(
    `Watching ${path.relative(process.cwd(), ARTICLES_DIR)} for Org, Markdown, and image changes...`,
  );
  return {
    close() {
      closed = true;
      if (timer) clearTimeout(timer);
      watcher.close();
      if (prepareProcess && !prepareProcess.killed)
        prepareProcess.kill("SIGINT");
    },
  };
}

if (
  process.argv[1] &&
  fileURLToPath(import.meta.url) === path.resolve(process.argv[1])
) {
  startContentWatcher()
    .then((watcher) => {
      const cleanup = () => {
        watcher.close();
        process.exit(0);
      };
      process.on("SIGINT", cleanup);
      process.on("SIGTERM", cleanup);
    })
    .catch((error) => {
      console.error(error);
      process.exitCode = 1;
    });
}
