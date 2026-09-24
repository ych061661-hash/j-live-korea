"use strict";

const fs = require("node:fs");
const path = require("node:path");

const ROOT = path.resolve(__dirname, "..");
const PUBLIC_FILES = ["_headers", "_redirects", "ads.txt", "robots.txt", "sitemap.xml"];
const PUBLIC_DIRECTORIES = ["calendar"];
const DEFAULT_OUTPUT = path.join(ROOT, "dist");

function assertSafeOutputPath(rootDir, outputDir) {
  const root = path.resolve(rootDir);
  const output = path.resolve(outputDir);
  const isWithin = (parent, candidate) => {
    const relative = path.relative(parent, candidate);
    return relative === "" || (relative !== ".." && !relative.startsWith(`..${path.sep}`) && !path.isAbsolute(relative));
  };
  const isInsideRoot = isWithin(root, output) && output !== root;
  const isAncestorOfRoot = isWithin(output, root) && output !== root;

  if (output === root || isAncestorOfRoot || (isInsideRoot && output !== path.join(root, "dist"))) {
    throw new Error(`Refusing to replace unsafe build output path: ${output}`);
  }
}

function buildSite({ rootDir = ROOT, outputDir = DEFAULT_OUTPUT } = {}) {
  const root = path.resolve(rootDir);
  const output = path.resolve(outputDir);
  assertSafeOutputPath(root, output);

  for (const entry of [...PUBLIC_FILES, ...PUBLIC_DIRECTORIES]) {
    if (!fs.existsSync(path.join(root, entry))) {
      throw new Error(`Required public site entry is missing: ${entry}`);
    }
  }

  fs.rmSync(output, { recursive: true, force: true });
  fs.mkdirSync(output, { recursive: true });

  for (const entry of PUBLIC_FILES) {
    fs.copyFileSync(path.join(root, entry), path.join(output, entry));
  }
  for (const entry of PUBLIC_DIRECTORIES) {
    fs.cpSync(path.join(root, entry), path.join(output, entry), { recursive: true });
  }

  return output;
}

if (require.main === module) {
  const output = buildSite();
  console.log(`Built public J-LIVE site in ${path.relative(ROOT, output)}`);
}

module.exports = { buildSite, assertSafeOutputPath, PUBLIC_FILES, PUBLIC_DIRECTORIES };
