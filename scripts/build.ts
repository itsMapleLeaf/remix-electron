import chokidar from "chokidar"
import { on } from "node:events"
import { copyFile, rm, stat } from "node:fs/promises"
import { join } from "node:path"
import { setTimeout } from "node:timers/promises"
import { fileURLToPath } from "node:url"
import * as tsup from "tsup"

const baseOptions: tsup.Options = {
  target: "node16",
  platform: "node",
  sourcemap: true,
}

async function moveFile(from: string, to: string) {
  await copyFile(from, to)
  await rm(from)
}

async function waitForFile(file: string): Promise<void> {
  const stats = await stat(file).catch(() => undefined)
  if (!stats) {
    await setTimeout(100)
    return waitForFile(file)
  }
}

async function build() {
  await rm(join(fileURLToPath(import.meta.url), "../../dist"), {
    recursive: true,
    force: true,
  })

  await Promise.all([
    tsup.build({
      ...baseOptions,
      entry: ["./src/main.ts"],
      format: ["cjs"],
      dts: true,
    }),
    tsup.build({
      ...baseOptions,
      entry: ["./src/renderer.ts"],
      format: ["cjs"],
      dts: true,
    }),
    tsup.build({
      ...baseOptions,
      entry: ["./src/cli.ts"],
      format: ["esm"],
    }),
  ])

  await waitForFile("./dist/renderer.d.ts")
  await moveFile("./dist/renderer.d.ts", "./renderer.d.ts")
}

await build()

if (process.argv.includes("--watch") || process.argv.includes("-w")) {
  console.info("Starting watch mode")

  const watcher = chokidar.watch(["./src/**/*.{ts,tsx}", "package.json"], {
    ignoreInitial: true,
  })

  for await (const _ of on(watcher, "change")) {
    await build()
  }
}
