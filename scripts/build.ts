import { rm } from "node:fs/promises"
import { dirname, join } from "node:path"
import { fileURLToPath } from "node:url"
import * as tsup from "tsup"

const __dirname = dirname(fileURLToPath(import.meta.url))

const options: tsup.Options = {
  target: "node16",
  platform: "node",
  sourcemap: true,
}

await rm(join(__dirname, "../dist"), { recursive: true, force: true })

await Promise.all([
  tsup.build({
    ...options,
    entry: ["./src/main.ts"],
    format: ["cjs"],
    dts: true,
    watch: process.argv.includes("--watch"),
  }),
  tsup.build({
    ...options,
    entry: ["./src/cli.ts"],
    format: ["esm"],
    watch: process.argv.includes("--watch"),
  }),
])
