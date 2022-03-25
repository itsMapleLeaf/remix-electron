#!/bin/env node
import type { AssetsManifestPromiseRef } from "@remix-run/dev/compiler/plugins/serverAssetsManifestPlugin.js"
import cac from "cac"
import chokidar from "chokidar"
import electronPath from "electron"
import * as esbuild from "esbuild"
import type { ExecaChildProcess } from "execa"
import { execa } from "execa"
import { oraPromise } from "ora"
import prettyMilliseconds from "pretty-ms"
import manifest from "../package.json"
import { generateAssetsManifest } from "./compiler/assets-manifest"
import { getBrowserBuildOptions } from "./compiler/browser-build"
import { getRemixElectronConfig } from "./compiler/config"
import { getElectronBuildOptions } from "./compiler/electron-build"
import type { CompilerMode } from "./compiler/mode"
import { maybeCompilerMode } from "./compiler/mode"
import { getServerBuildOptions } from "./compiler/server-build"

const cli = cac(manifest.name)

cli
  .command("dev", "Develop your app with reloading on changes")
  .action(async () => {
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

    const serverWatchPromise = esbuild.build({
      ...getServerBuildOptions(
        remixElectronConfig,
        mode,
        assetsManifestPromiseRef,
      ),
      watch: true,
    })

    const electronWatchPromise = esbuild.build({
      ...getElectronBuildOptions(remixElectronConfig, mode),
      watch: true,
    })

    await Promise.all([
      browserWatchPromise,
      serverWatchPromise,
      electronWatchPromise,
    ])

    let electronProcess: ExecaChildProcess | undefined
    function createElectronProcess() {
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

    createElectronProcess()

    chokidar
      .watch([
        remixElectronConfig.serverBuildPath,
        remixElectronConfig.electronBuildFile,
      ])
      .on("change", createElectronProcess)
  })

cli.command("build", "Build your app for production").action(async () => {
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

  const startTime = Date.now()

  await oraPromise(
    Promise.all([
      browserBuildPromise,
      esbuild.build(
        getServerBuildOptions(
          remixElectronConfig,
          mode,
          assetsManifestPromiseRef,
        ),
      ),
      esbuild.build(getElectronBuildOptions(remixElectronConfig, mode)),
    ]),
    {
      text: "Building...",
      successText: () => {
        const totalTime = prettyMilliseconds(Date.now() - startTime)
        return `Built in ${totalTime}`
      },
      failText: "Build failed",
    },
  )
})

cli.version(manifest.version)
cli.help()
cli.parse(process.argv, { run: false })

if (cli.matchedCommand) {
  await cli.runMatchedCommand()
} else {
  cli.outputHelp()
}
