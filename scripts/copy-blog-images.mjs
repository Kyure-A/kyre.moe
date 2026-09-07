import * as fs from "node:fs";
import * as path from "node:path";
import { fileURLToPath } from "node:url";

const ARTICLES_DIR = path.join(process.cwd(), "articles");
const PUBLIC_DIR = path.join(process.cwd(), "public", "blog");

const IMAGE_EXTENSIONS = [".png", ".jpg", ".jpeg", ".gif", ".webp", ".svg"];

function shouldCopy(src, dest) {
  try {
    if (!fs.existsSync(dest)) return true;
    const srcStat = fs.statSync(src);
    const destStat = fs.statSync(dest);
    return srcStat.size !== destStat.size || srcStat.mtimeMs > destStat.mtimeMs;
  } catch {
    return true;
  }
}

export function copyBlogImages(options = {}) {
  const { silent = false, onlySlug = null } = options;

  if (!fs.existsSync(ARTICLES_DIR)) {
    if (!silent) console.log("articles directory does not exist");
    return [];
  }

  const slugDirs = fs.readdirSync(ARTICLES_DIR, { withFileTypes: true });
  const copiedFiles = [];

  for (const dir of slugDirs) {
    if (!dir.isDirectory()) continue;
    if (onlySlug && dir.name !== onlySlug) continue;

    const slug = dir.name;
    const srcDir = path.join(ARTICLES_DIR, slug);
    const destDir = path.join(PUBLIC_DIR, slug);

    const files = fs.readdirSync(srcDir, { withFileTypes: true });
    const imageFiles = files.filter(
      (f) =>
        f.isFile() &&
        IMAGE_EXTENSIONS.includes(path.extname(f.name).toLowerCase()),
    );

    if (imageFiles.length === 0) continue;

    for (const file of imageFiles) {
      const src = path.join(srcDir, file.name);
      const dest = path.join(destDir, file.name);

      if (shouldCopy(src, dest)) {
        fs.mkdirSync(destDir, { recursive: true });
        fs.copyFileSync(src, dest);
        if (!silent) {
          console.log(`Copied: ${src} -> ${dest}`);
        }
        copiedFiles.push(dest);
      }
    }
  }

  if (!silent) {
    if (copiedFiles.length > 0) {
      console.log(`Blog images copied successfully (${copiedFiles.length} file(s))`);
    } else {
      console.log("Blog images are up to date.");
    }
  }

  return copiedFiles;
}

if (
  process.argv[1] &&
  fileURLToPath(import.meta.url) === path.resolve(process.argv[1])
) {
  copyBlogImages();
}
