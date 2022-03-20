import { app } from "electron"
import { RemixBrowserWindow } from "../../src/browser-window"

app.on("ready", async () => {
  const win = new RemixBrowserWindow()
  await win.loadRoute("/")
})
