import { readFileSync } from "node:fs";

const minimumVersion = readFileSync(
  new URL("../.node-version", import.meta.url),
  "utf8",
).trim();
const currentVersion = process.versions.node;
const parseVersion = (version) =>
  /^\d+\.\d+\.\d+$/.test(version) ? version.split(".").map(Number) : [];
const [requiredMajor, requiredMinor, requiredPatch] =
  parseVersion(minimumVersion);
const [major, minor, patch] = parseVersion(currentVersion);

if (
  ![requiredMajor, requiredMinor, requiredPatch, major, minor, patch].every(
    Number.isSafeInteger,
  ) ||
  major !== requiredMajor ||
  minor < requiredMinor ||
  (minor === requiredMinor && patch < requiredPatch)
) {
  console.error(
    `Node.js ${minimumVersion} or newer within ${requiredMajor}.x is required; found ${currentVersion}. Run nix develop to use the project's runtime.`,
  );
  process.exit(1);
}
