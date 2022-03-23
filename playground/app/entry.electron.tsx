import { app, BrowserWindow } from "electron"
import { configure, getRouteUrl } from "../../src/main"

app.on("ready", async () => {
  await configure()

  const win = new BrowserWindow()
  await win.loadURL(getRouteUrl("/"))
})
