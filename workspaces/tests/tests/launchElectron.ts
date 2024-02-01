import { fileURLToPath } from "node:url";
import {
	type Electron,
	type LaunchOptions,
	_electron as electron,
} from "@playwright/test";
import { appFolder } from "./integration.test.js";

type ElectronLaunchOptions = Parameters<Electron["launch"]>[0];

export async function launchElectron(options: ElectronLaunchOptions = {}) {
	console.info("Launching...");
	const app = await electron.launch(options);

	app.process().stdout?.pipe(process.stdout);
	app.process().stderr?.pipe(process.stderr);

	console.info("Waiting for first window...");
	const window = await app.firstWindow();

	console.info("Waiting for load event...");
	await window.waitForEvent("load");

	return Object.assign(window, {
		app,
		async [Symbol.asyncDispose]() {
			await app.close();
		},
	});
}
