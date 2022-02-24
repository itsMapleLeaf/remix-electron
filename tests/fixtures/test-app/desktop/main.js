const { initRemix } = require("remix-electron")
const { app, BrowserWindow, dialog } = require("electron")
const { join } = require("node:path")

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
    const url = await initRemix({ serverBuild: join(__dirname, "build") })

    // if (process.env.TEST_ROUTE) {
    //   url.pathname = process.env.TEST_ROUTE
    // }

    // dialog.showMessageBox({ title: "test", message: url.toString() })
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
