import type { BrowserWindowConstructorOptions } from "electron"
import { app, BrowserWindow } from "electron"
import { maybeCompilerMode } from "../compiler/compiler-mode"
import type { RemixElectronConfig } from "../compiler/config"
import { getRemixElectronConfig } from "../compiler/config"
import { getRouteUrl } from "./get-route-url"

export type RemixBrowserWindowOptions = BrowserWindowConstructorOptions & {
  initialRoute?: string
}

export async function createRemixBrowserWindow(
  options?: RemixBrowserWindowOptions,
) {
  const window = new BrowserWindow(options)

  const config = getRemixElectronConfig(
    maybeCompilerMode(process.env.NODE_ENV) || app.isPackaged
      ? "production"
      : "development",
  )

  if (config.compilerMode === "development") {
    const watcher = await createWatcher(config)
    watcher.on("change", () => window.reload())
  }

  if (options?.initialRoute) {
    await window.loadURL(getRouteUrl(options.initialRoute))
  }

  return window
}

async function createWatcher(config: RemixElectronConfig) {
  const chokidar = await import("chokidar")
  return chokidar.watch(config.serverBuildPath)
}
