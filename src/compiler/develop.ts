import type { AssetsManifestPromiseRef } from "@remix-run/dev/compiler/plugins/serverAssetsManifestPlugin"
import electronPath from "electron"
import * as esbuild from "esbuild"
import type { ExecaChildProcess } from "execa"
import { execa } from "execa"
import { isFile } from "../helpers/is-file"
import { generateAssetsManifest } from "./assets-manifest"
import { getBrowserBuildOptions } from "./browser-build"
import type { CompilerMode } from "./compiler-mode"
import { maybeCompilerMode } from "./compiler-mode"
import { getRemixElectronConfig } from "./config"
import {
  getElectronBuildOptions,
  getPreloadBuildOptions,
} from "./electron-build"
import { getServerBuildOptions } from "./server-build"

export async function develop() {
  const mode: CompilerMode =
    maybeCompilerMode(process.env.NODE_ENV) || "development"

  const remixElectronConfig = getRemixElectronConfig(mode)
  const assetsManifestPromiseRef: AssetsManifestPromiseRef = {}

  const browserWatchPromise = esbuild.build({
    ...getBrowserBuildOptions(remixElectronConfig, mode),
    watch: {
      onRebuild: (error, result) => {
        if (result) {
          assetsManifestPromiseRef.current = generateAssetsManifest(
            remixElectronConfig,
            result.metafile!,
          )

          esbuild
            .build(
              getServerBuildOptions(
                remixElectronConfig,
                mode,
                assetsManifestPromiseRef,
              ),
            )
            .catch(console.error)
        }
        if (error) {
          console.error(error)
        }
      },
    },
  })

  assetsManifestPromiseRef.current = browserWatchPromise.then((result) =>
    generateAssetsManifest(remixElectronConfig, result.metafile!),
  )

  let electronProcess: ExecaChildProcess | undefined
  function runElectron() {
    if (electronProcess) {
      console.info("Restarting electron")
      electronProcess.cancel()
    } else {
      console.info("Starting electron")
    }

    electronProcess = execa(electronPath as unknown as string, ["."], {
      stdio: "inherit",
    })
  }

  await Promise.all([
    browserWatchPromise,
    esbuild.build(
      getServerBuildOptions(
        remixElectronConfig,
        mode,
        assetsManifestPromiseRef,
      ),
    ),
    esbuild.build({
      ...getElectronBuildOptions(remixElectronConfig, mode),
      watch: {
        onRebuild: (error) => {
          if (error) {
            console.error(error)
          } else {
            runElectron()
          }
        },
      },
    }),
    (await isFile(remixElectronConfig.preloadEntryFile)) &&
      esbuild.build({
        ...getPreloadBuildOptions(remixElectronConfig, mode),
        watch: {
          onRebuild: (error) => {
            if (error) {
              console.error(error)
            } else {
              runElectron()
            }
          },
        },
      }),
  ])

  runElectron()
}