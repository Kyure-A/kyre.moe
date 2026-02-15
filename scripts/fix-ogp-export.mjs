import fs from "node:fs/promises";
import path from "node:path";

const EXPORT_DIR = path.join(process.cwd(), "out");
const OGP_FILE_NAME = "opengraph-image";
const OGP_URL_PATTERN = /\/opengraph-image(?=(?:\\)?["'])/g;

async function collectFiles(dir, files = []) {
	const entries = await fs.readdir(dir, { withFileTypes: true });
	for (const entry of entries) {
		const fullPath = path.join(dir, entry.name);
		if (entry.isDirectory()) {
			await collectFiles(fullPath, files);
			continue;
		}
		if (entry.isFile()) {
			files.push(fullPath);
		}
	}
	return files;
}

async function ensureExportDir() {
	const stat = await fs.stat(EXPORT_DIR).catch(() => null);
	if (!stat?.isDirectory()) {
		throw new Error(`Export directory not found: ${EXPORT_DIR}`);
	}
}

async function copyOgpFilesAsPng(files) {
	let copied = 0;
	for (const filePath of files) {
		if (path.basename(filePath) !== OGP_FILE_NAME) continue;
		const targetPath = `${filePath}.png`;
		await fs.copyFile(filePath, targetPath);
		copied += 1;
	}
	return copied;
}

async function rewriteHtmlMetaImageUrls(files) {
	let updated = 0;
	for (const filePath of files) {
		if (!filePath.endsWith(".html")) continue;

		const original = await fs.readFile(filePath, "utf8");
		const rewritten = original.replace(OGP_URL_PATTERN, "/opengraph-image.png");
		if (original === rewritten) continue;

		await fs.writeFile(filePath, rewritten);
		updated += 1;
	}
	return updated;
}

async function main() {
	await ensureExportDir();
	const files = await collectFiles(EXPORT_DIR);

	const copied = await copyOgpFilesAsPng(files);
	const updated = await rewriteHtmlMetaImageUrls(files);

	console.log(`OGP export fix complete: copied=${copied}, updated_html=${updated}`);
}

main().catch((error) => {
	console.error(error);
	process.exit(1);
});
