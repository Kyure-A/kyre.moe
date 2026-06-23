import { createHash } from "node:crypto";
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { parse as parseOrg } from "uniorg-parse/lib/parser.js";

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

function renderInlineChildren(children = [], context = {}) {
  return children.map((child) => renderInline(child, context)).join("");
}

function wrapInline(marker, node, context = {}) {
  const value = renderInlineChildren(node.children, {
    ...context,
    mark: node.type,
  });
  if (context.mark === node.type) return value;
  return `${marker}${value}${marker}`;
}

function markdownLinkTarget(node) {
  if (node.linkType === "file")
    return node.path ?? node.rawLink.replace(/^file:/, "");
  return node.rawLink;
}

function renderCaption(affiliated = {}) {
  const caption = affiliated.CAPTION?.[0];
  return caption ? renderInlineChildren(caption).trim() : "";
}

function isImagePath(value) {
  return /\.(?:avif|gif|jpe?g|png|svg|webp)$/i.test(value);
}

function isHttpUrl(value) {
  return /^https?:\/\//i.test(value);
}

function renderInline(node, context = {}) {
  switch (node.type) {
    case "text":
      return node.value;
    case "bold":
      return wrapInline("**", node, context);
    case "italic":
      return wrapInline("*", node, context);
    case "underline":
      return wrapInline("__", node, context);
    case "strike-through":
      return wrapInline("~~", node, context);
    case "code":
    case "verbatim":
      return `\`${node.value.replace(/`/g, "\\`")}\``;
    case "latex-fragment":
      return node.value;
    case "link": {
      const target = markdownLinkTarget(node);
      const label = renderInlineChildren(node.children, context).trim();
      if (node.linkType === "file" && isImagePath(target)) {
        return `![${label}](${target})`;
      }
      if (!label && isHttpUrl(target)) {
        return `<${target}>`;
      }
      return label ? `[${label}](${target})` : target;
    }
    default:
      return renderInlineChildren(node.children, context) || node.value || "";
  }
}

function renderParagraph(node) {
  const image = node.children?.find(
    (child) =>
      child.type === "link" &&
      child.linkType === "file" &&
      isImagePath(markdownLinkTarget(child)),
  );
  const onlyImage =
    image &&
    node.children.every(
      (child) =>
        child === image || (child.type === "text" && child.value.trim() === ""),
    );
  if (onlyImage) {
    const target = markdownLinkTarget(image);
    const caption = renderCaption(node.affiliated);
    return `![${caption}](${target})`;
  }
  return renderInlineChildren(node.children).trimEnd();
}

function indentBlock(value, spaces) {
  const prefix = " ".repeat(spaces);
  return value
    .split("\n")
    .map((line) => (line ? `${prefix}${line}` : line))
    .join("\n");
}

function renderListItem(node, index, listType, depth) {
  const marker = listType === "ordered" ? `${index + 1}.` : "-";
  const checkbox =
    node.checkbox === "on" ? " [x]" : node.checkbox === "off" ? " [ ]" : "";
  const renderedChildren = node.children
    .map((child) =>
      renderBlock(child, {
        listItem: true,
        depth: child.type === "plain-list" ? depth + 1 : depth,
      }),
    )
    .filter(Boolean);
  const [first = "", ...rest] = renderedChildren;
  const firstLine =
    `${"  ".repeat(depth)}${marker}${checkbox} ${first}`.trimEnd();
  const restLines = rest.map((child) => indentBlock(child, 2)).join("\n");
  return [firstLine, restLines].filter(Boolean).join("\n");
}

function renderBlock(node, context = {}) {
  switch (node.type) {
    case "org-data":
    case "section":
      return renderBlocks(node.children, context);
    case "keyword":
      return "";
    case "headline":
      return `${"#".repeat(node.level - (context.headingOffset ?? 0))} ${renderInlineChildren(node.children).trim()}`;
    case "paragraph":
      return renderParagraph(node);
    case "plain-list":
      return node.children
        .map((child, index) =>
          renderListItem(child, index, node.listType, context.depth ?? 0),
        )
        .join("\n");
    case "src-block": {
      const codeValue = removeCommonIndent(node.value);
      const code = codeValue.endsWith("\n") ? codeValue : `${codeValue}\n`;
      return `\`\`\`${node.language ?? ""}\n${code}\`\`\``;
    }
    case "example-block":
      return `\`\`\`\n${node.value}\n\`\`\``;
    case "quote-block":
      return renderBlocks(node.children)
        .split("\n")
        .map((line) => (line ? `> ${line}` : ">"))
        .join("\n");
    case "list-item":
      return renderListItem(node, 0, "unordered", context.depth ?? 0);
    default:
      return renderInline(node);
  }
}

function renderBlocks(children = [], context = {}) {
  return children
    .map((child) => renderBlock(child, context))
    .filter(Boolean)
    .join("\n\n");
}

function visit(node, callback) {
  callback(node);
  for (const child of node.children ?? []) visit(child, callback);
}

function headingOffset(tree) {
  const levels = [];
  visit(tree, (node) => {
    if (node.type === "headline") levels.push(node.level);
  });
  if (levels.length === 0) return 0;
  return Math.min(...levels) - 1;
}

function removeCommonIndent(value) {
  const lines = value.split("\n");
  const indents = lines
    .filter((line) => line.trim() !== "")
    .map((line) => line.match(/^[ \t]*/)?.[0].length ?? 0);
  const indent = indents.length ? Math.min(...indents) : 0;
  return lines.map((line) => line.slice(indent)).join("\n");
}

function exportOrgToMarkdown(jobs) {
  return jobs.map((job) => {
    const tree = parseOrg(job.source, {
      useSubSuperscripts: false,
    });
    return {
      ...job,
      outputMarkdown: `${renderBlock(tree, {
        headingOffset: headingOffset(tree),
      }).trim()}\n`,
    };
  });
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
    const frontmatter = buildFrontmatter(meta);
    return {
      content: `${frontmatter}${outputMarkdown}`,
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
