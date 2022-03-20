import { BrowserWindow } from "electron"

export class RemixBrowserWindow extends BrowserWindow {
  async loadRoute(path: string) {
    throw new Error("not implemented")
  }
}
