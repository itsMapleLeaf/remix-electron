import { cp, rm } from "node:fs/promises"
import { tmpdir } from "node:os"
import { join } from "node:path"
import { FuseV1Options, FuseVersion, flipFuses } from "@electron/fuses"
import { expect, test } from "@playwright/test"
import { execa } from "execa"
import retry from "p-retry"
import { launchElectron } from "./launchElectron.js"

const templateFolder = new URL("../../template", import.meta.url)
const packagePath = new URL("../../remix-electron", import.meta.url)

test("packaged build", async () => {
	await using tempFolder = useTempFolder("remix-electron-template")
	console.info("[test:build] Temp folder path:", tempFolder.path)

	await cp(templateFolder, tempFolder.path, {
		recursive: true,
		filter: (source) =>
			!source.includes("node_modules") &&
			!source.includes("dist") &&
			!source.includes("build") &&
			!source.includes("public/dist") &&
			!source.includes(".cache"),
	})
	console.info(
		`[test:build] Copied from ${templateFolder} to ${tempFolder.path}`,
	)

	const commands = [
		["pnpm", "install", `${packagePath}`],
		["pnpm", "run", "build", "--dir"],
	] as const

	for (const [command, ...args] of commands) {
		console.info(`[test:build] Running command: ${command} ${args.join(" ")}`)
		await execa(command, args, {
			cwd: tempFolder.path,
			stderr: "inherit",
		})
	}

	const executablePath = getExecutablePath(tempFolder.path)

	await flipFuses(executablePath, {
		version: FuseVersion.V1,
		[FuseV1Options.EnableNodeCliInspectArguments]: true,
	})

	await using window = await launchElectron({
		executablePath,
	})
	console.info("[test:build] Launched Electron window ✅")

	await expect(window.locator("h1")).toHaveText("Welcome to Remix")
})

function useTempFolder(prefix: string) {
	const path = join(tmpdir(), `${prefix}-${Date.now()}`)
	return {
		path,
		async [Symbol.asyncDispose]() {
			await retry(() => rm(path, { recursive: true, force: true }))
		},
	}
}

function getExecutablePath(folderPath: string) {
	if (process.platform === "win32") {
		return join(folderPath, "dist/win-unpacked/remix-electron-template.exe")
	}
	if (process.platform === "darwin") {
		return join(
			folderPath,
			"dist/mac/remix-electron-template.app/Contents/MacOS/remix-electron-template",
		)
	}
	return join(folderPath, "dist/linux-unpacked/remix-electron-template")
}
