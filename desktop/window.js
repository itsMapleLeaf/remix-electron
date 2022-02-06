// @ts-check
const { BrowserWindow } = require("electron")

/** @type {BrowserWindow | undefined} */
let win

exports.createWindow = async function createWindow() {
  win = new BrowserWindow({ show: false })
  await win.loadURL("remix://app/")
  win.show()
}
