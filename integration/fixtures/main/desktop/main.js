// @ts-check
const { app, BrowserWindow, dialog } = require("electron")
const { initRemix } = require("remix-electron")
const remixConfig = require("../remix.config")

/** @type {BrowserWindow | undefined} */
let win

void (async () => {
  try {
    const url = await initRemix({ remixConfig })

    await app.whenReady()

    win = new BrowserWindow({ show: false })
    await win.loadURL(url)
    win.show()
  } catch (error) {
    dialog.showErrorBox(
      "Error",
      error?.stack || error?.message || String(error),
    )
  }
})()
