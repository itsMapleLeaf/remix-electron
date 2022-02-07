// @ts-check
const { app, BrowserWindow, dialog } = require("electron")
const { initRemix } = require("remix-electron")
const remixConfig = require("../remix.config")

/** @type {BrowserWindow | undefined} */
let win

/** @param {string} url */
async function createWindow(url) {
  win = new BrowserWindow({ show: false })
  await win.loadURL(url)
  win.show()
}

app.on("ready", async () => {
  try {
    const url = await initRemix({ remixConfig })
    await createWindow(url)
  } catch (error) {
    dialog.showErrorBox("Error", getErrorStack(error))
    console.error(error)
  }
})

/** @param {unknown} error */
function getErrorStack(error) {
  return error instanceof Error ? error.stack || error.message : String(error)
}
