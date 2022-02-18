import * as serverBuild from "@remix-run/dev/server-build"
import { app, BrowserWindow, dialog } from "electron"
import { initRemix } from "remix-electron"

let win: BrowserWindow | undefined

async function createWindow(url: string) {
  win = new BrowserWindow({ show: false })
  await win.loadURL(url)
  win.show()
}

app.on("ready", async () => {
  try {
    const url = await initRemix({ serverBuild })
    await createWindow(url)
  } catch (error) {
    dialog.showErrorBox("Error", getErrorStack(error))
    console.error(error)
  }
})

function getErrorStack(error: unknown) {
  return error instanceof Error ? error.stack || error.message : String(error)
}
