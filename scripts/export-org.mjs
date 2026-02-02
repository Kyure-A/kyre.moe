import { execFileSync } from "node:child_process";
import fs from "node:fs";
import os from "node:os";
import path from "node:path";

const BLOG_DIR = path.join(process.cwd(), "content", "blog");
const ORG_EXTENSION = ".org";

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
  const initialState = {
    result: "",
    inFence: false,
    fenceChar: "",
    fenceLen: 0,
    inInline: false,
    inlineLen: 0,
    lineStart: 0,
    cursor: 0,
  };

  const finalState = Array.from(source).reduce((state, ch, index) => {
    if (index < state.cursor) return state;

    if (ch === "\n") {
      return {
        ...state,
        result: `${state.result}\n`,
        lineStart: index + 1,
        cursor: index + 1,
      };
    }

    if (!state.inInline && (ch === "`" || ch === "~")) {
      const runMatch =
        ch === "`"
          ? source.slice(index).match(/^`+/)
          : source.slice(index).match(/^~+/);
      const runLen = runMatch ? runMatch[0].length : 0;
      if (runLen >= 3) {
        const before = source.slice(state.lineStart, index);
        if (/^[ \t]*$/.test(before)) {
          const isClosing =
            state.inFence && ch === state.fenceChar && runLen >= state.fenceLen;
          const nextFenceState = isClosing
            ? { inFence: false, fenceChar: "", fenceLen: 0 }
            : state.inFence
              ? {}
              : { inFence: true, fenceChar: ch, fenceLen: runLen };
          return {
            ...state,
            ...nextFenceState,
            result: state.result + source.slice(index, index + runLen),
            cursor: index + runLen,
          };
        }
      }
    }

    if (!state.inFence && ch === "`") {
      const runMatch = source.slice(index).match(/^`+/);
      const runLen = runMatch ? runMatch[0].length : 0;
      const shouldClose = state.inInline && runLen === state.inlineLen;
      const nextInlineState = state.inInline
        ? shouldClose
          ? { inInline: false, inlineLen: 0 }
          : {}
        : { inInline: true, inlineLen: runLen };
      return {
        ...state,
        ...nextInlineState,
        result: state.result + source.slice(index, index + runLen),
        cursor: index + runLen,
      };
    }

    if (!state.inFence && state.inInline && ch === "\\" && source[index + 1] === "_") {
      return {
        ...state,
        result: `${state.result}_`,
        cursor: index + 2,
      };
    }

    return {
      ...state,
      result: state.result + ch,
      cursor: index + 1,
    };
  }, initialState);

  return finalState.result;
}

function exportOrgToMarkdown(filePath) {
  const tempOut = path.join(
    os.tmpdir(),
    `org-md-${Date.now()}-${path.basename(filePath, ORG_EXTENSION)}.md`,
  );
  const elisp = `(progn
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
		(org-export-to-file 'md-fenced ${escapeString(tempOut)}))`;
  execFileSync("emacs", ["--batch", filePath, "--eval", elisp], {
    stdio: "inherit",
  });
  const exported = fs.readFileSync(tempOut, "utf-8");
  fs.rmSync(tempOut, { force: true });
  return exported;
}

if (!fs.existsSync(BLOG_DIR)) {
  console.error(`Blog directory not found: ${BLOG_DIR}`);
  process.exit(1);
}

const orgFiles = walk(BLOG_DIR).filter((file) => file.endsWith(ORG_EXTENSION));

if (orgFiles.length === 0) {
  console.log("No Org files found.");
  process.exit(0);
}

orgFiles
  .map((filePath) => {
    const source = fs.readFileSync(filePath, "utf-8");
    const meta = parseOrgMeta(source);
    const outputMarkdown = unescapeUnderscoreInBackticks(
      exportOrgToMarkdown(filePath).replace(/\\`/g, "`"),
    );
    // ox-md escapes backticks, unescape them for inline code
    const frontmatter = buildFrontmatter(meta);
    const outputPath = filePath.replace(/\.org$/i, ".md");
    return { frontmatter, outputMarkdown, outputPath };
  })
  .forEach(({ frontmatter, outputMarkdown, outputPath }) => {
    fs.writeFileSync(outputPath, `${frontmatter}${outputMarkdown}`);
    console.log(`Exported ${path.relative(process.cwd(), outputPath)}`);
  });
