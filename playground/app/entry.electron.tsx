import { app } from "electron"
import {
  configure,
  createRemixBrowserWindow,
  getRouteUrl,
} from "remix-electron"

app.on("ready", async () => {
  await configure()

  const win = await createRemixBrowserWindow()
  await win.loadURL(getRouteUrl("/"))
})
