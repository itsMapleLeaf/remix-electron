const { initRemix } = require("remix-electron")
const { app, BrowserWindow } = require("electron")
const path = require("node:path")

/** @param {string} url */
async function createWindow(url) {
	const win = new BrowserWindow()

	// load the devtools first before loading the app URL so we can see initial network requests
	// electron needs some page content to show the dev tools, so we'll load a dummy page first
	await win.loadURL(
		`data:text/html;charset=utf-8,${encodeURI("<p>Loading...</p>")}`,
	)
	win.webContents.openDevTools()
	win.webContents.on("devtools-opened", () => {
		// devtools takes a bit to load, so we'll wait a bit before loading the app URL
		setTimeout(() => {
			win.loadURL(url).catch(console.error)
		}, 500)
	})
}

app.on("ready", async () => {
	const url = await initRemix({
		serverBuild: path.join(__dirname, "../build/index.js"),
	})
	await createWindow(url)
})
