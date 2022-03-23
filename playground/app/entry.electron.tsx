import { app, BrowserWindow } from "electron"

app.on("ready", async () => {
  const win = new BrowserWindow({
    webPreferences: {
      nodeIntegration: true,
    },
  })
  await win.loadURL(/* remixElectron.urlForRoute('/') */)
})
