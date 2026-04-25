#!/usr/bin/env node
// Entry that loads the compiled CLI. During development use ts-node src/cli.ts
try {
  require("../dist/bin/doctor.js");
} catch (err) {
  if (!(err instanceof Error) || !("code" in err) || (err as NodeJS.ErrnoException).code !== "MODULE_NOT_FOUND") {
    throw err;
  }

  // Fallback to running the TypeScript source directly in dev setups
  require("ts-node/register");
  require("../src/cli.ts");
}
