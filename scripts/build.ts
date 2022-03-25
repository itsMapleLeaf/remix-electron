import * as tsup from "tsup"

const options: tsup.Options = {
  target: "node16",
  platform: "node",
  sourcemap: true,
}

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
