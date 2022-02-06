// @ts-check
const { app, dialog } = require("electron")
const {
  registerRemixProtocol,
  registerRemixProtocolAsPriviledged,
} = require("./register-remix-protocol")
const { createWindow } = require("./window")

void (async () => {
  try {
    registerRemixProtocolAsPriviledged()
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
