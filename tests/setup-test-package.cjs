const { mkdirSync, rmSync, writeFileSync } = require("node:fs");

rmSync(".codex-temp/test-build", { force: true, recursive: true });
mkdirSync(".codex-temp/test-build", { recursive: true });
writeFileSync(
  ".codex-temp/test-build/package.json",
  JSON.stringify({ type: "commonjs" }),
);
