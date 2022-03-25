import type { BrowserWindowConstructorOptions } from "electron"
import { app, BrowserWindow } from "electron"
import { maybeCompilerMode } from "../compiler/compiler-mode"
import type { RemixElectronConfig } from "../compiler/config"
import { getRemixElectronConfig } from "../compiler/config"

export class RemixBrowserWindow extends BrowserWindow {
  static async create(options?: BrowserWindowConstructorOptions) {
    const window = new RemixBrowserWindow({
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

      const watcher = await RemixBrowserWindow.createWatcher(config)
      watcher.on("change", () => window.reload())
    }

    if (!window.isVisible()) {
      window.once("ready-to-show", () => window.show())
    }

    return window
  }

  private static async createWatcher(config: RemixElectronConfig) {
    const chokidar = await import("chokidar")
    return chokidar.watch(config.serverBuildPath)
  }
}
