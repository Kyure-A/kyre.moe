import * as fs from "node:fs";
import * as path from "node:path";

const CONTENT_DIR = path.join(process.cwd(), "content", "blog");
const PUBLIC_DIR = path.join(process.cwd(), "public", "blog");

const IMAGE_EXTENSIONS = [".png", ".jpg", ".jpeg", ".gif", ".webp", ".svg"];

function copyBlogImages() {
  if (!fs.existsSync(CONTENT_DIR)) {
    console.log("content/blog directory does not exist");
    return;
  }

  const slugDirs = fs.readdirSync(CONTENT_DIR, { withFileTypes: true });

  for (const dir of slugDirs) {
    if (!dir.isDirectory()) continue;

    const slug = dir.name;
    const srcDir = path.join(CONTENT_DIR, slug);
    const destDir = path.join(PUBLIC_DIR, slug);

    const files = fs.readdirSync(srcDir, { withFileTypes: true });
    const imageFiles = files.filter(
      (f) =>
        f.isFile() &&
        IMAGE_EXTENSIONS.includes(path.extname(f.name).toLowerCase()),
    );

    if (imageFiles.length === 0) continue;

    fs.mkdirSync(destDir, { recursive: true });

    for (const file of imageFiles) {
      const src = path.join(srcDir, file.name);
      const dest = path.join(destDir, file.name);
      fs.copyFileSync(src, dest);
      console.log(`Copied: ${src} -> ${dest}`);
    }
  }

  console.log("Blog images copied successfully");
}

copyBlogImages();
