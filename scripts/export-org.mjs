import { execFileSync } from "node:child_process";
import { createHash } from "node:crypto";
import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import { fileURLToPath } from "node:url";

const ARTICLES_DIR = path.join(process.cwd(), "articles");
const CACHE_PATH = path.join(process.cwd(), ".org-export-cache.json");
const ORG_EXTENSION = ".org";
const SCRIPT_PATH = fileURLToPath(import.meta.url);

const META_MAP = {
  TITLE: "title",
  DATE: "date",
  DESCRIPTION: "description",
  TAGS: "tags",
  CANONICAL: "canonical",
  COVER: "cover",
  DRAFT: "draft",
};

function walk(dir) {
  const entries = fs.readdirSync(dir, { withFileTypes: true });
  return entries.flatMap((entry) => {
    const fullPath = path.join(dir, entry.name);
    if (entry.isDirectory()) return walk(fullPath);
    if (entry.isFile()) return [fullPath];
    return [];
  });
}

function parseOrgMeta(source) {
  const lines = source.split(/\r?\n/);
  const blankIndex = lines.findIndex((line) => line.trim() === "");
  const metaLines = blankIndex === -1 ? lines : lines.slice(0, blankIndex);
  const pairs = metaLines
    .map((line) => {
      const match = line.match(/^#\+([A-Z_]+):\s*(.*)$/);
      if (!match) return null;
      const key = META_MAP[match[1]];
      if (!key) return null;
      return [key, match[2].trim()];
    })
    .filter((entry) => entry !== null);
  return Object.fromEntries(pairs);
}

function escapeString(value) {
  if (value === null || value === undefined) return '""';
  return `"${String(value).replace(/\\/g, "\\\\").replace(/"/g, '\\"')}"`;
}

function hashContent(...values) {
  const hash = createHash("sha256");
  values.forEach((value) => {
    hash.update(value);
  });
  return hash.digest("hex");
}

function readCache() {
  try {
    const cache = JSON.parse(fs.readFileSync(CACHE_PATH, "utf-8"));
    return cache && typeof cache === "object" ? cache : {};
  } catch (error) {
    if (error.code === "ENOENT" || error instanceof SyntaxError) return {};
    throw error;
  }
}

function buildFrontmatter(meta) {
  const lines = ["---"];
  if (meta.title) lines.push(`title: ${escapeString(meta.title)}`);
  if (meta.description)
    lines.push(`description: ${escapeString(meta.description)}`);
  if (meta.date) lines.push(`date: ${escapeString(meta.date)}`);
  if (meta.canonical) lines.push(`canonical: ${escapeString(meta.canonical)}`);
  if (meta.cover) lines.push(`cover: ${escapeString(meta.cover)}`);
  if (meta.tags) {
    const tags = String(meta.tags)
      .split(/[,\s]+/)
      .map((tag) => tag.trim())
      .filter(Boolean);
    if (tags.length) {
      lines.push("tags:", ...tags.map((tag) => `  - ${escapeString(tag)}`));
    }
  }
  if (meta.draft) {
    const isDraft = String(meta.draft).toLowerCase();
    if (["true", "yes", "1"].includes(isDraft)) {
      lines.push("draft: true");
    }
  }
  lines.push("---", "");
  return lines.join("\n");
}

function unescapeUnderscoreInBackticks(source) {
  let result = "";
  let inFence = false;
  let fenceChar = "";
  let fenceLen = 0;
  let inInline = false;
  let inlineLen = 0;
  let lineStart = 0;
  let cursor = 0;

  for (const [index, ch] of Array.from(source).entries()) {
    if (index < cursor) continue;

    if (ch === "\n") {
      result += "\n";
      lineStart = index + 1;
      cursor = index + 1;
      continue;
    }

    if (!inInline && (ch === "`" || ch === "~")) {
      const runMatch =
        ch === "`"
          ? source.slice(index).match(/^`+/)
          : source.slice(index).match(/^~+/);
      const runLen = runMatch ? runMatch[0].length : 0;
      if (runLen >= 3) {
        const before = source.slice(lineStart, index);
        if (/^[ \t]*$/.test(before)) {
          const isClosing = inFence && ch === fenceChar && runLen >= fenceLen;
          if (isClosing) {
            inFence = false;
            fenceChar = "";
            fenceLen = 0;
          } else if (!inFence) {
            inFence = true;
            fenceChar = ch;
            fenceLen = runLen;
          }
          result += source.slice(index, index + runLen);
          cursor = index + runLen;
          continue;
        }
      }
    }

    if (!inFence && ch === "`") {
      const runMatch = source.slice(index).match(/^`+/);
      const runLen = runMatch ? runMatch[0].length : 0;
      const shouldClose = inInline && runLen === inlineLen;
      if (shouldClose) {
        inInline = false;
        inlineLen = 0;
      } else if (!inInline) {
        inInline = true;
        inlineLen = runLen;
      }
      result += source.slice(index, index + runLen);
      cursor = index + runLen;
      continue;
    }

    if (!inFence && inInline && ch === "\\" && source[index + 1] === "_") {
      result += "_";
      cursor = index + 2;
      continue;
    }

    result += ch;
    cursor = index + 1;
  }

  return result;
}

function exportOrgToMarkdown(jobs) {
  const tempDir = fs.mkdtempSync(path.join(os.tmpdir(), "org-md-"));
  const elispPath = path.join(tempDir, "export.el");
  const exportJobs = jobs.map((job, index) => ({
    ...job,
    tempOutputPath: path.join(tempDir, `${index}.md`),
  }));
  const elispJobs = exportJobs
    .map(
      ({ filePath, tempOutputPath }) =>
        `(${escapeString(filePath)} . ${escapeString(tempOutputPath)})`,
    )
    .join("\n");
  const elisp = `;;; -*- lexical-binding: t; -*-
(progn
		(require 'ox-md)
		(defun kyre-md--ensure-trailing-newline (value)
			(if (and value (not (string-suffix-p "\\n" value)))
				(concat value "\\n")
				value))
		(defun kyre-md-src-block (src-block _contents info)
			(let* ((lang (org-element-property :language src-block))
					(code (org-remove-indentation (org-export-format-code-default src-block info)))
					(code (kyre-md--ensure-trailing-newline code))
					(lang (or lang "")))
				(format "\`\`\`%s\\n%s\`\`\`" lang code)))
		(defun kyre-md-underline (_underline contents _info)
			(format "__%s__" (or contents "")))
		(defun kyre-md-strike-through (_strike-through contents _info)
			(format "~~%s~~" (or contents "")))
		(org-export-define-derived-backend 'md-fenced 'md
			:translate-alist '((src-block . kyre-md-src-block)
				(underline . kyre-md-underline)
				(strike-through . kyre-md-strike-through)))
		(setq org-export-with-toc nil
				org-export-with-title nil
				org-export-with-sub-superscripts nil)
		(dolist (job '(${elispJobs}))
			(find-file (car job))
			(org-export-to-file 'md-fenced (cdr job))
			(kill-buffer)))`;

  try {
    fs.writeFileSync(elispPath, elisp);
    execFileSync("emacs", ["--batch", "--load", elispPath], {
      stdio: "inherit",
    });
    return exportJobs.map((job) => ({
      ...job,
      outputMarkdown: fs.readFileSync(job.tempOutputPath, "utf-8"),
    }));
  } finally {
    fs.rmSync(tempDir, { force: true, recursive: true });
  }
}

if (!fs.existsSync(ARTICLES_DIR)) {
  console.error(`Article directory not found: ${ARTICLES_DIR}`);
  process.exit(1);
}

const orgFiles = walk(ARTICLES_DIR)
  .filter((file) => file.endsWith(ORG_EXTENSION))
  .sort();

if (orgFiles.length === 0) {
  console.log("No Org files found.");
  process.exit(0);
}

const cache = readCache();
const scriptHash = hashContent(fs.readFileSync(SCRIPT_PATH));
const jobs = orgFiles.map((filePath) => {
  const source = fs.readFileSync(filePath, "utf-8");
  const relativePath = path.relative(process.cwd(), filePath);
  const outputPath = filePath.replace(/\.org$/i, ".md");
  return {
    filePath,
    source,
    relativePath,
    outputPath,
    hash: hashContent(scriptHash, source),
  };
});
const changedJobs = jobs.filter(
  ({ hash, outputPath, relativePath }) =>
    cache[relativePath] !== hash || !fs.existsSync(outputPath),
);

if (changedJobs.length === 0) {
  console.log("Org files are up to date.");
  process.exit(0);
}

exportOrgToMarkdown(changedJobs)
  .map(({ source, outputMarkdown, outputPath, relativePath, hash }) => {
    const meta = parseOrgMeta(source);
    const processedMarkdown = unescapeUnderscoreInBackticks(
      outputMarkdown.replace(/\\`/g, "`"),
    );
    // ox-md escapes backticks, unescape them for inline code
    const frontmatter = buildFrontmatter(meta);
    return {
      content: `${frontmatter}${processedMarkdown}`,
      hash,
      outputPath,
      relativePath,
    };
  })
  .forEach(({ content, hash, outputPath, relativePath }) => {
    fs.writeFileSync(outputPath, content);
    cache[relativePath] = hash;
    console.log(`Exported ${path.relative(process.cwd(), outputPath)}`);
  });

const nextCache = Object.fromEntries(
  jobs.map(({ relativePath, hash }) => [
    relativePath,
    cache[relativePath] ?? hash,
  ]),
);
fs.writeFileSync(CACHE_PATH, `${JSON.stringify(nextCache, null, 2)}\n`);
