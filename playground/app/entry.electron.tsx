import { app, BrowserWindow } from "electron"
import { configure, getRouteUrl } from "remix-electron"

app.on("ready", async () => {
  await configure()

  const win = new BrowserWindow()
  await win.loadURL(getRouteUrl("/"))
})
