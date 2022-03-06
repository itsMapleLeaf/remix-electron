import { initRemix } from "remix-electron";
import { app, BrowserWindow, dialog } from "electron";
import { join } from "node:path";

/** @type {BrowserWindow | undefined} */
let win

/** @param {string} url */
async function createWindow(url: string) {
    win = new BrowserWindow({ show: false })
    await win.loadURL(url)
    win.show()
}

app.on("ready", async () => {
    try {
        const url = await initRemix({ serverBuild: join(__dirname, "build") })
        await createWindow(url)
    } catch (error) {
        dialog.showErrorBox("Error", getErrorStack(error))
        console.error(error)
    }
})

/** @param {unknown} error */
function getErrorStack(error: any) {
    return error instanceof Error ? error.stack || error.message : String(error)
}

