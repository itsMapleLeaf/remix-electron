import { app } from "electron"
import { configure, getRouteUrl, RemixBrowserWindow } from "remix-electron"

app.on("ready", async () => {
  await configure()

  const win = await RemixBrowserWindow.create()
  await win.loadURL(getRouteUrl("/"))
})
