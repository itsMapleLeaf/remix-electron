import type { BrowserWindowConstructorOptions } from "electron"
import { app, BrowserWindow } from "electron"
import { maybeCompilerMode } from "../compiler/compiler-mode"
import type { RemixElectronConfig } from "../compiler/config"
import { getRemixElectronConfig } from "../compiler/config"

export async function createRemixBrowserWindow(
  options?: BrowserWindowConstructorOptions,
) {
  const window = new BrowserWindow({
    show: false,
    ...options,
  })

  const config = getRemixElectronConfig(
    maybeCompilerMode(process.env.NODE_ENV) || app.isPackaged
      ? "production"
      : "development",
  )

  if (config.compilerMode === "development") {
    window.webContents.openDevTools()

    const watcher = await createWatcher(config)
    watcher.on("change", () => window.reload())
  }

  if (!window.isVisible()) {
    window.once("ready-to-show", () => window.show())
  }

  return window
}

async function createWatcher(config: RemixElectronConfig) {
  const chokidar = await import("chokidar")
  return chokidar.watch(config.serverBuildPath)
}
