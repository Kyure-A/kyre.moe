import fs from "node:fs";

const checks = [
	{
		name: "markdown-it-link-preview",
		file: "node_modules/markdown-it-link-preview/src/index.js",
		needles: ["'\": '&#39;'", "const imageHtml = ogData.image"],
	},
];

const failures = [];

for (const check of checks) {
	if (!fs.existsSync(check.file)) {
		failures.push(`${check.name}: missing ${check.file}`);
		continue;
	}
	const text = fs.readFileSync(check.file, "utf8");
	for (const needle of check.needles) {
		if (!text.includes(needle)) {
			failures.push(`${check.name}: missing "${needle}"`);
		}
	}
}

if (failures.length > 0) {
	console.error("Patch verification failed:");
	for (const failure of failures) {
		console.error(`- ${failure}`);
	}
	process.exit(1);
}

console.log("Patch verification passed.");
