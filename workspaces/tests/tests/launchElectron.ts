import { type Electron, _electron as electron } from "@playwright/test"

type ElectronLaunchOptions = Parameters<Electron["launch"]>[0]

export async function launchElectron(options: ElectronLaunchOptions = {}) {
	console.info("Launching...")
	const app = await electron.launch({
		...options,
		env: {
			...(process.env as Record<string, string>),
			...options.env,
		},
	})

	console.info("Waiting for first window...")
	const window = await app.firstWindow()

	console.info("Waiting for load event...")
	await window.waitForEvent("load")

	return Object.assign(window, {
		app,
		async [Symbol.asyncDispose]() {
			await app.close()
		},
	})
}
