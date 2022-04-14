import { createRemixBrowserWindow, initRemix } from "@remix-electron/main"
import { app, ipcMain } from "electron"
import type { LoadContext } from "./context"

app.on("ready", async () => {
  await initRemix({
    getLoadContext: (): LoadContext => ({ secret: "43" }),
  })

  const win = await createRemixBrowserWindow({
    initialRoute: "/live-data",
    show: false,
    webPreferences: {
      nodeIntegration: true,
      contextIsolation: false,
    },
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