#!/bin/env node

// src/cli.ts
import { build } from "esbuild";
import { join } from "node:path";
var projectRoot = process.cwd();
var [command, ...args] = process.argv.slice(2);
if (command === "build") {
  await build({
    entryPoints: [join(projectRoot, "app/entry.electron.tsx")],
    bundle: true,
    outfile: join(projectRoot, "build/main.cjs"),
    format: "cjs",
    logLevel: "info"
  });
}
//# sourceMappingURL=cli.js.map