import * as esbuild from "esbuild"
import { builtinModules as nodeBuiltins } from "node:module"
import { join } from "node:path"
import type { CompilerMode } from "./mode"

const projectRoot = process.cwd()

export function createElectronBuild(mode: CompilerMode) {
  return esbuild.build({
    entryPoints: [join(projectRoot, "app/entry.electron.tsx")],
    bundle: true,
    outfile: join(projectRoot, "build/main.cjs"),
    format: "cjs",
    platform: "node",
    external: [...nodeBuiltins, "electron", "remix-electron"],
    logLevel: "silent",
    plugins: [],
    treeShaking: true,
    inject: [join(__dirname, "../shims/react-shim.ts")],
    minify: mode === "production",
    sourcemap: mode === "development" ? "external" : false,
  })
}
