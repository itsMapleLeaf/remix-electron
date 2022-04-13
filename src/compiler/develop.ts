import type { AssetsManifestPromiseRef } from "@remix-run/dev/compiler/plugins/serverAssetsManifestPlugin"
import electronPath from "electron"
import * as esbuild from "esbuild"
import type { ExecaChildProcess } from "execa"
import { execa } from "execa"
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

export async function develop() {
  const mode: CompilerMode =
    maybeCompilerMode(process.env.NODE_ENV) || "development"

  const remixElectronConfig = getRemixElectronConfig(mode)
  const assetsManifestPromiseRef: AssetsManifestPromiseRef = {}

  const browserWatchPromise = esbuild.build({
    ...getBrowserBuildOptions(remixElectronConfig, mode),
    watch: {
      onRebuild: async (error, result) => {
        if (result) {
          assetsManifestPromiseRef.current = generateAssetsManifest(
            remixElectronConfig,
            result.metafile!,
          )

          try {
            await esbuild.build(
              await getServerBuildOptions(
                remixElectronConfig,
                mode,
                assetsManifestPromiseRef,
              ),
            )
          } catch (error) {
            console.error(error)
          }
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
      env: { ...process.env, NODE_ENV: mode },
    })
  }

  await Promise.all([
    browserWatchPromise,
    esbuild.build(
      await getServerBuildOptions(
        remixElectronConfig,
        mode,
        assetsManifestPromiseRef,
      ),
    ),
    esbuild.build({
      ...(await getElectronBuildOptions(remixElectronConfig, mode)),
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
        ...(await getPreloadBuildOptions(remixElectronConfig, mode)),
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
