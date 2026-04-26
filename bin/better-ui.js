#!/usr/bin/env node
try {
  require("../dist/src/cli.js");
} catch (err) {
  if (!err || err.code !== "MODULE_NOT_FOUND") {
    throw err;
  }
  require("ts-node/register");
  require("../src/cli.ts");
}
