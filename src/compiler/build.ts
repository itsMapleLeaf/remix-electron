import type { AssetsManifestPromiseRef } from "@remix-run/dev/compiler/plugins/serverAssetsManifestPlugin"
import * as esbuild from "esbuild"
import type { CompilerMode } from "../common/compiler-mode"
import { maybeCompilerMode } from "../common/compiler-mode"
import { isFile } from "../common/is-file"
import { generateAssetsManifest } from "./assets-manifest"
import { getBrowserBuildOptions } from "./browser-build"
import { getRemixElectronConfig } from "./config"
import {
  getElectronBuildOptions,
  getPreloadBuildOptions,
} from "./electron-build"
import { getServerBuildOptions } from "./server-build"

export async function build() {
  const mode: CompilerMode =
    maybeCompilerMode(process.env.NODE_ENV) || "production"

  const remixElectronConfig = getRemixElectronConfig(mode)

  const browserBuildPromise = esbuild.build(
    getBrowserBuildOptions(remixElectronConfig, mode),
  )

  const assetsManifestPromiseRef: AssetsManifestPromiseRef = {
    current: browserBuildPromise.then((build) =>
      generateAssetsManifest(remixElectronConfig, build.metafile!),
    ),
  }

  return Promise.all([
    browserBuildPromise,
    esbuild.build(
      await getServerBuildOptions(
        remixElectronConfig,
        mode,
        assetsManifestPromiseRef,
      ),
    ),
    esbuild.build(await getElectronBuildOptions(remixElectronConfig, mode)),
    (await isFile(remixElectronConfig.preloadEntryFile)) &&
      esbuild.build(await getPreloadBuildOptions(remixElectronConfig, mode)),
  ])
}
