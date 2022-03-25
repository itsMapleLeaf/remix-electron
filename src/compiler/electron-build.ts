import type * as esbuild from "esbuild"
import { builtinModules as nodeBuiltins } from "node:module"
import { join } from "node:path"
import type { RemixElectronConfig } from "./config"
import type { CompilerMode } from "./mode"

export function getElectronBuildOptions(
  remixElectronConfig: RemixElectronConfig,
  mode: CompilerMode,
): esbuild.BuildOptions {
  return {
    entryPoints: [remixElectronConfig.electronEntryFile],
    bundle: true,
    outfile: remixElectronConfig.electronBuildFile,
    format: "cjs",
    platform: "node",
    external: [...nodeBuiltins, "electron", "remix-electron"],
    logLevel: "silent",
    plugins: [],
    treeShaking: true,
    inject: [join(__dirname, "../shims/react-shim.ts")],
    minify: mode === "production",
    sourcemap: mode === "development" ? "external" : false,
  }
}
