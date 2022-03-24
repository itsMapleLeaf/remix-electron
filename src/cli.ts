#!/bin/env node
import type { AssetsManifestPromiseRef } from "@remix-run/dev/compiler/plugins/serverAssetsManifestPlugin.js"
import cac from "cac"
import { oraPromise } from "ora"
import prettyMilliseconds from "pretty-ms"
import manifest from "../package.json"
import { createBrowserBuild } from "./compiler/browser-build"
import { getRemixConfig } from "./compiler/config"
import { createElectronBuild } from "./compiler/electron-build"
import type { CompilerMode } from "./compiler/mode"
import { maybeCompilerMode } from "./compiler/mode"
import {
  createServerBuild,
  generateAssetsManifest,
} from "./compiler/server-build"

const mode: CompilerMode =
  maybeCompilerMode(process.env.NODE_ENV) || "production"

const cli = cac(manifest.name)

cli.command("build", "Build your app for production").action(async () => {
  const remixConfig = getRemixConfig(mode)
  const browserBuildPromise = createBrowserBuild(remixConfig, mode)

  const assetsManifestPromiseRef: AssetsManifestPromiseRef = {
    current: browserBuildPromise.then((build) =>
      generateAssetsManifest(remixConfig, build.metafile!),
    ),
  }

  const startTime = Date.now()

  await oraPromise(
    Promise.all([
      browserBuildPromise,
      createServerBuild(remixConfig, mode, assetsManifestPromiseRef),
      createElectronBuild(mode),
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
