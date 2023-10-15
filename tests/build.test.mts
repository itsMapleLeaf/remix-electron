import { execa } from "execa"
import { join } from "node:path"
import { cp, rm } from "node:fs/promises"
import type { ElectronApplication, Page } from "playwright"
import { _electron as electron } from "playwright"
import { afterAll, beforeAll, expect, test } from "vitest"
import { templateFolder } from "./paths.mts"
import { tmpdir } from "node:os"
import { fileURLToPath } from "node:url"
import retry from "p-retry"

const packagePath = fileURLToPath(new URL("../", import.meta.url))
const tempFolder = join(tmpdir(), `remix-electron-template-${Date.now()}`)

let electronApp: ElectronApplication | undefined
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
		await cp(templateFolder, tempFolder, {
			recursive: true,
			filter: (source) =>
				!source.includes("node_modules") &&
				!source.includes("dist") &&
				!source.includes("build") &&
				!source.includes("public/dist") &&
				!source.includes(".cache"),
		})

		const commands = [
			["pnpm", "install", packagePath],
			["pnpm", "run", "build", "--dir"],
		] as const
		for (const [command, ...args] of commands) {
			await execa(command, args, {
				cwd: tempFolder,
				stdio: "inherit",
			})
		}

		electronApp = await electron.launch({
			executablePath: getExecutablePath(),
			env: { ...(process.env as Record<string, string>) },
		})

		window = await electronApp.firstWindow()
	},
	1000 * 60 * 5,
)

afterAll(async () => {
	await electronApp?.close()
	await retry(() => rm(tempFolder, { recursive: true, force: true }))
})

test("packaged build", async () => {
	expect(await window.locator("h1").textContent()).toBe("Welcome to Remix")
})
