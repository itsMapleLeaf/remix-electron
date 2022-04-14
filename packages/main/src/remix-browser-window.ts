import {
  getPreloadBuildFile,
  getProjectRoot,
  getServerBuildFile,
  isFile,
  maybeCompilerMode,
} from "@remix-electron/common"
import type { BrowserWindowConstructorOptions } from "electron"
import { app, BrowserWindow } from "electron"
import { getRouteUrl } from "./get-route-url"

export type RemixBrowserWindowOptions = BrowserWindowConstructorOptions & {
  initialRoute?: string
}

export async function createRemixBrowserWindow(
  options?: RemixBrowserWindowOptions,
) {
  const compilerMode =
    maybeCompilerMode(process.env.NODE_ENV) ||
    (app.isPackaged ? "production" : "development")

  const projectRoot = getProjectRoot()

  const preloadBuildFile = getPreloadBuildFile(projectRoot)
  const preloadBuildFileExists = await isFile(preloadBuildFile)

  const window = new BrowserWindow({
    ...options,
    webPreferences: {
      preload: preloadBuildFileExists ? preloadBuildFile : undefined,
      ...options?.webPreferences,
    },
  })

  if (compilerMode === "development") {
    // only import chokidar if a watcher is needed,
    // so we don't pull it in in prod
    const chokidar = await import("chokidar")
    const watcher = chokidar.watch(getServerBuildFile(projectRoot))
    watcher.on("change", () => window.reload())
  }

  if (options?.initialRoute) {
    await window.loadURL(getRouteUrl(options.initialRoute))
  }

  return window
}
