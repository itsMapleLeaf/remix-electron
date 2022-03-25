import type { RemixConfig } from "@remix-run/dev/config.js"
import type { RouteManifest } from "@remix-run/dev/config/routes.js"
import { defineConventionalRoutes } from "@remix-run/dev/config/routesConvention.js"
import type { ServerMode } from "@remix-run/dev/config/serverModes.js"
import { join } from "node:path"
import type { CompilerMode } from "./mode"

export type RemixElectronConfig = RemixConfig & {
  electronEntryFile: string
  electronBuildFile: string
}

export function getRemixElectronConfig(
  mode: CompilerMode,
): RemixElectronConfig {
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
    serverBuildPath: join(rootDirectory, "build/server.cjs"),
    serverBuildTargetEntryModule: "",
    serverDependenciesToBundle: [],
    serverMode: mode as ServerMode,
    serverModuleFormat: "cjs",
    serverPlatform: "node",
    assetsBuildDirectory: join(rootDirectory, "public/build/assets"),
    electronEntryFile: join(rootDirectory, "app/entry.electron.tsx"),
    electronBuildFile: join(rootDirectory, "build/main.cjs"),
  }
}
