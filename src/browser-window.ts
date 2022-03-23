import type { BrowserWindowConstructorOptions } from "electron"
import { BrowserWindow } from "electron"

export class RemixBrowserWindow extends BrowserWindow {
  constructor(options: BrowserWindowConstructorOptions = {}) {
    super(options)
  }

  async loadRoute(path: string) {
    throw new Error("not implemented")
  }
}
