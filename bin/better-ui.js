#!/usr/bin/env node

const path = require('path');
const fs = require('fs');

// Path to the compiled JavaScript file
const compiledPath = path.join(__dirname, '../dist/src/cli.js');

if (fs.existsSync(compiledPath)) {
  // If the compiled file exists, run it
  require(compiledPath);
} else {
  // If not, show a clear error message
  console.error("Error: Compiled code not found at dist/src/cli.js");
  console.error("If you are the developer, please run 'npm run build' before executing the CLI.");
  process.exit(1);
}