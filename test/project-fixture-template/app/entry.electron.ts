import { app } from "electron"
import {
  createRemixBrowserWindow,
  getRouteUrl,
  initRemix,
} from "remix-electron"

app.on("ready", async () => {
  await initRemix()

  const win = await createRemixBrowserWindow({
    show: false,
  })

  if (!win.isVisible()) {
    win.once("ready-to-show", () => win.show())
  }

  await win.loadURL(getRouteUrl("/"))

  if (process.env.NODE_ENV === "development") {
    win.webContents.openDevTools()
  }
})
