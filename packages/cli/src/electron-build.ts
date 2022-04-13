import type { CompilerMode } from "@remix-electron/common"
import type * as esbuild from "esbuild"
import type { RemixElectronConfig } from "./config"
import { getNodeExternals } from "./externals"

export async function getElectronBuildOptions(
  remixElectronConfig: RemixElectronConfig,
  mode: CompilerMode,
): Promise<esbuild.BuildOptions> {
  return {
    bundle: true,
    format: "cjs",
    platform: "node",
    target: "node16",
    external: await getNodeExternals(remixElectronConfig.rootDirectory),
    logLevel: "silent",
    treeShaking: true,
    minify: mode === "production",
    sourcemap: mode === "development" ? "external" : false,
    entryPoints: [remixElectronConfig.electronEntryFile],
    outfile: remixElectronConfig.electronBuildFile,
  }
}

export async function getPreloadBuildOptions(
  remixElectronConfig: RemixElectronConfig,
  mode: CompilerMode,
): Promise<esbuild.BuildOptions> {
  return {
    ...(await getElectronBuildOptions(remixElectronConfig, mode)),
    entryPoints: [remixElectronConfig.preloadEntryFile],
    outfile: remixElectronConfig.preloadBuildFile,
  }
}
