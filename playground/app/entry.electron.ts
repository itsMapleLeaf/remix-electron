import { app, ipcMain } from "electron"
import { configure, createRemixBrowserWindow } from "remix-electron"
import type { LoadContext } from "./context"

app.on("ready", async () => {
  await configure({
    getLoadContext: (): LoadContext => ({ secret: "43" }),
  })

  const win = await createRemixBrowserWindow({
    initialRoute: "/",
    show: false,
  })

  if (!win.isVisible()) {
    win.once("ready-to-show", () => win.show())
  }

  if (process.env.NODE_ENV === "development") {
    win.webContents.openDevTools()
  }
})

ipcMain.on("ping", () => {
  console.info("pin pon")
})
