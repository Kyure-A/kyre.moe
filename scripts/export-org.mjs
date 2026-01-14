import fs from "node:fs";
import path from "node:path";
import os from "node:os";
import { execFileSync } from "node:child_process";

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
	const files = [];
	for (const entry of entries) {
		const fullPath = path.join(dir, entry.name);
		if (entry.isDirectory()) {
			files.push(...walk(fullPath));
		} else if (entry.isFile()) {
			files.push(fullPath);
		}
	}
	return files;
}

function parseOrgMeta(source) {
	const meta = {};
	const lines = source.split(/\r?\n/);
	for (const line of lines) {
		const match = line.match(/^#\+([A-Z_]+):\s*(.*)$/);
		if (!match) {
			if (line.trim() === "") break;
			continue;
		}
		const key = META_MAP[match[1]];
		if (!key) continue;
		meta[key] = match[2].trim();
	}
	return meta;
}

function yamlEscape(value) {
	return `"${String(value).replace(/\\/g, "\\\\").replace(/"/g, '\\"')}"`;
}

function buildFrontmatter(meta) {
	const lines = ["---"];
	if (meta.title) lines.push(`title: ${yamlEscape(meta.title)}`);
	if (meta.description) lines.push(`description: ${yamlEscape(meta.description)}`);
	if (meta.date) lines.push(`date: ${yamlEscape(meta.date)}`);
	if (meta.canonical) lines.push(`canonical: ${yamlEscape(meta.canonical)}`);
	if (meta.cover) lines.push(`cover: ${yamlEscape(meta.cover)}`);
	if (meta.tags) {
		const tags = String(meta.tags)
			.split(/[,\s]+/)
			.map((tag) => tag.trim())
			.filter(Boolean);
		if (tags.length) {
			lines.push("tags:");
			for (const tag of tags) {
				lines.push(`  - ${yamlEscape(tag)}`);
			}
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

function exportOrgToMarkdown(filePath) {
	const tempOut = path.join(
		os.tmpdir(),
		`org-md-${Date.now()}-${path.basename(filePath, ORG_EXTENSION)}.md`,
	);
	const elisp = `(progn (require 'ox-md) (setq org-export-with-toc nil org-export-with-title nil) (org-export-to-file 'md ${JSON.stringify(tempOut)}))`;
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

for (const filePath of orgFiles) {
	const source = fs.readFileSync(filePath, "utf-8");
	const meta = parseOrgMeta(source);
	const outputMarkdown = exportOrgToMarkdown(filePath);
	const frontmatter = buildFrontmatter(meta);
	const outputPath = filePath.replace(/\.org$/i, ".md");
	fs.writeFileSync(outputPath, `${frontmatter}${outputMarkdown}`);
	console.log(`Exported ${path.relative(process.cwd(), outputPath)}`);
}
