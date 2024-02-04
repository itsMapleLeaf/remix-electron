import { type Electron, _electron as electron } from "@playwright/test"

type ElectronLaunchOptions = Parameters<Electron["launch"]>[0]

export async function launchElectron(options: ElectronLaunchOptions = {}) {
	console.info("Launching...")
	const app = await electron.launch(options)

	console.info("Waiting for first window...")
	const window = await app.firstWindow()

	console.info("Waiting for load event...")
	await window.waitForEvent("load")

	return { app, window }
}
