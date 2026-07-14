const {
  mkdirSync,
  readdirSync,
  rmSync,
  writeFileSync,
} = require("node:fs");
const { dirname, join, relative } = require("node:path");

const TEST_BUILD_DIRECTORY = ".codex-temp/test-build";

function createStyleStubs(directory) {
  for (const entry of readdirSync(directory, { withFileTypes: true })) {
    const sourcePath = join(directory, entry.name);

    if (entry.isDirectory()) {
      createStyleStubs(sourcePath);
      continue;
    }

    if (!entry.name.endsWith(".scss")) {
      continue;
    }

    const outputPath = join(TEST_BUILD_DIRECTORY, relative(".", sourcePath));
    mkdirSync(dirname(outputPath), { recursive: true });
    writeFileSync(outputPath, "");
  }
}

rmSync(TEST_BUILD_DIRECTORY, { force: true, recursive: true });
mkdirSync(TEST_BUILD_DIRECTORY, { recursive: true });
writeFileSync(
  `${TEST_BUILD_DIRECTORY}/package.json`,
  JSON.stringify({ type: "commonjs" }),
);
createStyleStubs("src");
