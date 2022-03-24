#!/bin/env node
import type { AssetsManifestPromiseRef } from "@remix-run/dev/compiler/plugins/serverAssetsManifestPlugin.js"
import type { RemixConfig } from "@remix-run/dev/config.js"
import type { RouteManifest } from "@remix-run/dev/config/routes.js"
import { defineConventionalRoutes } from "@remix-run/dev/config/routesConvention.js"
import { ServerMode } from "@remix-run/dev/config/serverModes.js"
import { join } from "node:path"
import { createBrowserBuild } from "./browser-build"
import { createElectronBuild } from "./electron-build"
import { createServerBuild, generateAssetsManifest } from "./server-build"

const rootDirectory = process.cwd()
const appDirectory = join(rootDirectory, "app")
const rootRouteFile = join(appDirectory, "root.tsx")

const routes: RouteManifest = {
  root: {
    path: "",
    id: "root",
    file: rootRouteFile,
  },
}
const conventionalRoutes = defineConventionalRoutes(appDirectory, [])

for (const key of Object.keys(conventionalRoutes)) {
  const route = conventionalRoutes[key]!
  routes[route.id] = { ...route, parentId: route!.parentId || "root" }
}

const remixConfig: RemixConfig = {
  appDirectory,
  cacheDirectory: join(rootDirectory, ".cache"),
  devServerBroadcastDelay: 0,
  devServerPort: 8002,
  entryClientFile: join(rootDirectory, "app/entry.client.tsx"),
  entryServerFile: join(rootDirectory, "app/entry.server.tsx"),
  publicPath: "/build/assets/",
  rootDirectory,
  routes,
  serverBuildPath: join(rootDirectory, "build/server.cjs"),
  serverBuildTargetEntryModule: "",
  serverDependenciesToBundle: [],
  serverMode: ServerMode.Development,
  serverModuleFormat: "cjs",
  serverPlatform: "node",
  assetsBuildDirectory: join(rootDirectory, "public/build/assets"),
}

const [command, ...args] = process.argv.slice(2)

if (command === "build") {
  const browserBuildPromise = createBrowserBuild(remixConfig, {})

  const assetsManifestPromiseRef: AssetsManifestPromiseRef = {
    current: browserBuildPromise.then((build) => {
      return generateAssetsManifest(remixConfig, build.metafile!)
    }),
  }

  await Promise.all([
    browserBuildPromise,
    createServerBuild(remixConfig, {}, assetsManifestPromiseRef),
    createElectronBuild(),
  ])
}

if (command === "watch") {
  // todo
}

export {}
