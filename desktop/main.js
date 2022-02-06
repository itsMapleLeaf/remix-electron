// @ts-check
const { app, dialog } = require("electron")
const { registerRemixProtocol } = require("./register-remix-protocol")
const { createWindow } = require("./window")

void (async () => {
  try {
    await app.whenReady()
    registerRemixProtocol()
    await createWindow()
  } catch (error) {
    dialog.showErrorBox(
      "Error",
      error?.stack || error?.message || String(error),
    )
  }
})()
