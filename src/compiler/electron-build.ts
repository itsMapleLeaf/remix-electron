import type * as esbuild from "esbuild"
import { builtinModules as nodeBuiltins } from "node:module"
import type { CompilerMode } from "./compiler-mode"
import type { RemixElectronConfig } from "./config"

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
    minify: mode === "production",
    sourcemap: mode === "development" ? "external" : false,
  }
}
