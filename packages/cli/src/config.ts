import type { CompilerMode } from "@remix-electron/common"
import {
  getPreloadBuildFile,
  getProjectRoot,
  getServerBuildFile,
} from "@remix-electron/common"
import type { RemixConfig } from "@remix-run/dev/config.js"
import type { RouteManifest } from "@remix-run/dev/config/routes.js"
import { defineConventionalRoutes } from "@remix-run/dev/config/routesConvention.js"
import type { ServerMode } from "@remix-run/dev/config/serverModes.js"
import { join } from "node:path"

export type RemixElectronConfig = RemixConfig & {
  compilerMode: CompilerMode
  electronEntryFile: string
  electronBuildFile: string
  preloadEntryFile: string
  preloadBuildFile: string
}

export function getRemixElectronConfig(
  mode: CompilerMode,
): RemixElectronConfig {
  const rootDirectory = getProjectRoot()
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

  return {
    appDirectory,
    cacheDirectory: join(rootDirectory, ".cache"),
    devServerBroadcastDelay: 0,
    devServerPort: 8002,
    entryClientFile: join(rootDirectory, "app/entry.client.tsx"),
    entryServerFile: join(rootDirectory, "app/entry.server.tsx"),
    publicPath: "/build/assets/",
    rootDirectory,
    routes,
    serverBuildPath: getServerBuildFile(rootDirectory),
    serverBuildTargetEntryModule: "",
    serverDependenciesToBundle: [],
    serverMode: mode as ServerMode,
    serverModuleFormat: "cjs",
    serverPlatform: "node",
    assetsBuildDirectory: join(rootDirectory, "public/build/assets"),

    compilerMode: mode,
    electronEntryFile: join(rootDirectory, "app/entry.electron.ts"),
    electronBuildFile: join(rootDirectory, "build/main.cjs"),
    preloadEntryFile: join(rootDirectory, "app/entry.preload.ts"),
    preloadBuildFile: getPreloadBuildFile(rootDirectory),
  }
}
