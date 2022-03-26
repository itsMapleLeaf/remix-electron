import type * as esbuild from "esbuild"
import { builtinModules as nodeBuiltins } from "node:module"
import type { CompilerMode } from "./compiler-mode"
import type { RemixElectronConfig } from "./config"

const electronOptions = (mode: CompilerMode): esbuild.BuildOptions => ({
  bundle: true,
  format: "cjs",
  platform: "node",
  external: [...nodeBuiltins, "electron", "remix-electron"],
  logLevel: "silent",
  treeShaking: true,
  minify: mode === "production",
  sourcemap: mode === "development" ? "external" : false,
})

export function getElectronBuildOptions(
  remixElectronConfig: RemixElectronConfig,
  mode: CompilerMode,
): esbuild.BuildOptions {
  return {
    ...electronOptions(mode),
    entryPoints: [remixElectronConfig.electronEntryFile],
    outfile: remixElectronConfig.electronBuildFile,
  }
}

export function getPreloadBuildOptions(
  remixElectronConfig: RemixElectronConfig,
  mode: CompilerMode,
): esbuild.BuildOptions {
  return {
    ...electronOptions(mode),
    entryPoints: [remixElectronConfig.preloadEntryFile],
    outfile: remixElectronConfig.preloadBuildFile,
  }
}
