import { app } from "electron"
import { RemixBrowserWindow } from "remix-electron/src/main"

app.on("ready", async () => {
  const win = new RemixBrowserWindow()
  await win.loadRoute("/")
})
