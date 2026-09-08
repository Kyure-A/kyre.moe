import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { copyBlogImages } from "./copy-blog-images.mjs";
import { exportOrg } from "./export-org.mjs";

const ARTICLES_DIR = path.join(process.cwd(), "articles");
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
  const basename = path.basename(filename);
  if (
    basename.startsWith(".") ||
    basename.startsWith("#") ||
    basename.endsWith("~")
  ) {
    return true;
  }
  return false;
}

export function startContentWatcher(options = {}) {
  const { prefix = "[content]" } = options;
  const log = (...args) => console.log(prefix, ...args);

  log("Performing initial content sync...");
  exportOrg();
  copyBlogImages();

  if (!fs.existsSync(ARTICLES_DIR)) {
    console.error(prefix, `Articles directory not found: ${ARTICLES_DIR}`);
    return { close: () => {} };
  }

  let timer = null;
  let hasOrgChange = false;
  let hasImageChange = false;

  const flush = () => {
    const runOrg = hasOrgChange;
    const runImg = hasImageChange;
    hasOrgChange = false;
    hasImageChange = false;
    timer = null;

    if (runOrg) {
      log("Detected changes in Org files. Rebuilding...");
      try {
        exportOrg();
      } catch (err) {
        console.error(prefix, "Error exporting Org files:", err);
      }
    }

    if (runImg) {
      log("Detected changes in blog images. Copying...");
      try {
        copyBlogImages();
      } catch (err) {
        console.error(prefix, "Error copying blog images:", err);
      }
    }
  };

  const scheduleFlush = () => {
    if (timer) clearTimeout(timer);
    timer = setTimeout(flush, 150);
  };

  const watcher = fs.watch(
    ARTICLES_DIR,
    { recursive: true },
    (_eventType, filename) => {
      if (!filename || isIgnored(filename)) return;

      const ext = path.extname(filename).toLowerCase();
      if (ext === ".org") {
        hasOrgChange = true;
        scheduleFlush();
      } else if (IMAGE_EXTENSIONS.has(ext)) {
        hasImageChange = true;
        scheduleFlush();
      }
    },
  );

  log(
    `Watching for changes in ${path.relative(process.cwd(), ARTICLES_DIR)}...`,
  );

  return {
    close() {
      if (timer) clearTimeout(timer);
      watcher.close();
    },
  };
}

if (
  process.argv[1] &&
  fileURLToPath(import.meta.url) === path.resolve(process.argv[1])
) {
  const watcher = startContentWatcher();
  const cleanup = () => {
    watcher.close();
    process.exit(0);
  };
  process.on("SIGINT", cleanup);
  process.on("SIGTERM", cleanup);
}
