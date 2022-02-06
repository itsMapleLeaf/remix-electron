// @ts-check
const { BrowserWindow } = require("electron")

/** @type {BrowserWindow | undefined} */
let win

exports.createWindow = async function createWindow() {
  win = new BrowserWindow({ show: false })
  await win.loadURL("http://app/")
  if (process.env.NODE_ENV === "development") {
    win.webContents.openDevTools()
  }
  win.show()
}
