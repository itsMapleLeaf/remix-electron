/* eslint-disable no-console */
import { execa } from "execa"
import { join } from "node:path"
import { cp, rm } from "node:fs/promises"
import type { ElectronApplication, Page } from "playwright"
import { _electron as electron } from "playwright"
import { afterAll, beforeAll, expect, test } from "vitest"
import { templateFolder } from "./paths.mts"
import { tmpdir } from "node:os"
import { fileURLToPath } from "node:url"

const packagePath = fileURLToPath(new URL("../", import.meta.url))
const tempFolder = join(tmpdir(), `remix-electron-template-${Date.now()}`)

let electronApp: ElectronApplication
let window: Page

const getExecutablePath = () => {
	if (process.platform === "win32") {
		return join(tempFolder, "dist/win-unpacked/remix-electron-template.exe")
	}
	if (process.platform === "darwin") {
		return join(
			tempFolder,
			"dist/mac/remix-electron-template.app/Contents/MacOS/remix-electron-template",
		)
	}
	return join(tempFolder, "dist/linux-unpacked/remix-electron-template")
}

beforeAll(
	async () => {
		console.info(`Copying template to ${tempFolder}`)
		await cp(templateFolder, tempFolder, {
			recursive: true,
			filter: (source) =>
				!source.includes("node_modules") &&
				!source.includes("dist") &&
				!source.includes("build") &&
				!source.includes("public/dist") &&
				!source.includes(".cache"),
		})

		console.time("Building template")
		const commands = [
			["pnpm", "install", packagePath],
			["pnpm", "run", "build", "--dir"],
		] as const
		for (const [command, ...args] of commands) {
			console.info("Run:", command)
			await execa(command, args, {
				cwd: tempFolder,
				stdio: "inherit",
			})
		}
		console.timeEnd("Building template")

		console.time("Launching electron")
		electronApp = await electron.launch({
			executablePath: getExecutablePath(),
			env: { ...(process.env as Record<string, string>) },
		})
		console.timeEnd("Launching electron")

		console.time("Waiting for window")
		window = await electronApp.firstWindow()
		console.timeEnd("Waiting for window")
	},
	1000 * 60 * 5,
)

afterAll(async () => {
	await electronApp.close()
	await rm(tempFolder, { recursive: true, force: true })
})

test("packaged build", async () => {
	expect(await window.locator("h1").textContent()).toBe("Welcome to Remix")
})
