import { readFile } from "node:fs/promises"
import { fileURLToPath } from "node:url"
import {
	type ElectronApplication,
	type Page,
	expect,
	test,
} from "@playwright/test"
import { execa } from "execa"
import { launchElectron } from "./launchElectron.js"

export const appFolder = new URL("../../test-app", import.meta.url)

let app!: ElectronApplication
let window!: Page

test.beforeAll("build", async () => {
	await execa("pnpm", ["build"], {
		cwd: appFolder,
		stderr: "inherit",
	})
})

test.beforeEach(async () => {
	;({ app, window } = await launchElectron({
		cwd: fileURLToPath(appFolder),
		args: ["."],
	}))
})

test.afterEach(async () => {
	await app.close()
})

test("electron apis", async () => {
	const userDataPath = await app.evaluate(({ app }) => app.getPath("userData"))

	await expect(window.locator('[data-testid="user-data-path"]')).toHaveText(
		userDataPath,
	)
})

test("scripts", async () => {
	const counter = window.locator("[data-testid='counter']")
	await expect(counter).toHaveText("0")
	await counter.click({ clickCount: 2 })
	await expect(counter).toHaveText("2")
})

test("action referrer redirect", async () => {
	await window.goto("http://localhost/referrer-redirect/form")

	const redirectCount = window.locator("[data-testid=redirects]")
	await expect(redirectCount).toHaveText("0")
	await window.click("text=submit")
	await expect(redirectCount).toHaveText("1")
})

test.skip("multipart uploads", async () => {
	await window.goto("http://localhost/multipart-uploads")

	const assetUrl = new URL(
		"./fixtures/asset-files/file-upload.txt",
		import.meta.url,
	)

	const assetContent = await readFile(assetUrl, "utf-8")

	await window
		.locator("input[type=file]")
		.setInputFiles(fileURLToPath(assetUrl))
	await window.locator("button").click()
	await expect(window.locator("[data-testid=result]")).toHaveText(assetContent)
})

test("can load public assets that contain whitespace in their path", async () => {
	await window.goto("http://localhost/with spaces.txt")

	await expect(window.locator("body")).toHaveText(
		"This is a file with spaces in the path",
	)
})
