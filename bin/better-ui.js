#!/usr/bin/env node
try {
  require("../dist/src/cli.js");
} catch (err) {
  // If the compiled entrypoint is missing entirely, allow falling back to
  // running the TypeScript source (development installs with ts-node).
  // However, if the compiled file exists but a runtime dependency is missing
  // (e.g. commander), attempting to load ts-node will still fail. In that
  // case bail with a helpful message to the user explaining the package
  // should list runtime deps in "dependencies".
  try {
    // If the missing module is the compiled CLI file itself, attempt TS
    // fallback.
    const fs = require("fs");
    const compiled = require.resolve("../dist/src/cli.js");
    if (!fs.existsSync(compiled)) {
      // compiled file not present on disk -> dev setup, try ts-node
      require("ts-node/register");
      require("../src/cli.ts");
    }
    // If compiled exists but require failed earlier, it's likely because a
    // dependency required by dist is missing. Throw a clearer error.
    console.error("Error loading compiled CLI. A runtime dependency is missing.\nPlease ensure the package's runtime dependencies are installed (move packages from devDependencies to dependencies or run 'npm install' in the package folder).");
    process.exit(1);
  }
  catch (inner) {
    // If require.resolve itself failed, treat as missing compiled file and
    // try to run the TypeScript source (development mode).
    try {
      require("ts-node/register");
      require("../src/cli.ts");
    }
    catch (e) {
      console.error("Failed to start CLI: ", e && e.stack ? e.stack : e);
      process.exit(1);
    }
  }
}
