import { getAppDependencies } from "@remix-run/dev/compiler/dependencies"
import type * as esbuild from "esbuild"
import { builtinModules as nodeBuiltins } from "node:module"
import type { CompilerMode } from "./compiler-mode"
import type { RemixElectronConfig } from "./config"

export function getElectronBuildOptions(
  remixElectronConfig: RemixElectronConfig,
  mode: CompilerMode,
): esbuild.BuildOptions {
  const dependencies = getAppDependencies(remixElectronConfig)
  return {
    bundle: true,
    format: "cjs",
    platform: "node",
    external: [
      ...nodeBuiltins,
      ...nodeBuiltins.map((name) => `node:${name}`),
      ...Object.keys(dependencies),
      "electron", // sometimes electron is included as a dev dependency, and won't get returned from getAppDependencies
    ],
    logLevel: "silent",
    treeShaking: true,
    minify: mode === "production",
    sourcemap: mode === "development" ? "external" : false,
    entryPoints: [remixElectronConfig.electronEntryFile],
    outfile: remixElectronConfig.electronBuildFile,
  }
}

export function getPreloadBuildOptions(
  remixElectronConfig: RemixElectronConfig,
  mode: CompilerMode,
): esbuild.BuildOptions {
  return {
    ...getElectronBuildOptions(remixElectronConfig, mode),
    entryPoints: [remixElectronConfig.preloadEntryFile],
    outfile: remixElectronConfig.preloadBuildFile,
  }
}
