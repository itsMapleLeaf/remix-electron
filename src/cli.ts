#!/bin/env node
import { build, BuildOptions } from "esbuild"
import { join } from "node:path"

const projectRoot = process.cwd()

const [command, ...args] = process.argv.slice(2)

const buildOptions: BuildOptions = {
  entryPoints: [join(projectRoot, "app/entry.electron.tsx")],
  bundle: true,
  outfile: join(projectRoot, "build/main.cjs"),
  format: "cjs",
  platform: "node",
  external: ["electron", "remix-electron"],
  logLevel: "info",
}

if (command === "build") {
  await build({
    ...buildOptions,
    minify: true,
  })
}

if (command === "watch") {
  await build({
    ...buildOptions,
    watch: true,
  })
}

export {}
