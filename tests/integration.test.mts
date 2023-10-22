import { expect } from "@playwright/test"
import { execa } from "execa"
import { readFile } from "node:fs/promises"
import { join } from "node:path"
import { fileURLToPath } from "node:url"
import { _electron as electron } from "playwright"
import { beforeAll, test } from "vitest"

const appFolder = join(__dirname, "fixtures/test-app")

beforeAll(async () => {
	await execa("pnpm", ["build"], {
		cwd: appFolder,
		stderr: "inherit",
	})
}, 1000 * 20)

async function launch() {
	const app = await electron.launch({
		cwd: appFolder,
		args: ["."],
	})

	const window = await app.firstWindow()
	await window.waitForEvent("load")

	return {
		app,
		window,
		dispose: async () => {
			await app.close()
		},
	}
}

test("electron apis", async () => {
	const { app, window, dispose } = await launch()

	const userDataPath = await app.evaluate(({ app }) => app.getPath("userData"))

	expect(
		await window.locator('[data-testid="user-data-path"]').textContent(),
	).toBe(userDataPath)

	await dispose()
})

test("scripts", async () => {
	const { window, dispose } = await launch()

	const counter = window.locator("[data-testid='counter']")
	expect(await counter.textContent()).toBe("0")
	await counter.click({ clickCount: 2 })
	expect(await counter.textContent()).toBe("2")

	await dispose()
})

test("action referrer redirect", async () => {
	const { window, dispose } = await launch()

	await window.goto("http://localhost/referrer-redirect/form")

	const redirectCount = window.locator("[data-testid=redirects]")
	await expect(redirectCount).toHaveText("0")
	await window.click("text=submit")
	await expect(redirectCount).toHaveText("1")

	await dispose()
})

test.skip("multipart uploads", async () => {
	const { window, dispose } = await launch()

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

	await dispose()
})
