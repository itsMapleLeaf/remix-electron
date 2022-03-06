import { expect } from "@playwright/test"
import { execa } from "execa"
import { join } from "node:path"
import type { ElectronApplication, Page } from "playwright"
import { _electron as electron } from "playwright"
import { afterAll, beforeAll, test } from "vitest"

const appFolder = join(__dirname, "fixtures/test-app")

let electronApp: ElectronApplication
let window: Page

beforeAll(async () => {
  await execa("pnpx", ["remix", "build"], {
    cwd: appFolder,
  })

  electronApp = await electron.launch({
    cwd: appFolder,
    args: ["."],
  })

  window = await electronApp.firstWindow()
  await window.waitForEvent("load")
}, 1000 * 20)

afterAll(async () => {
  await electronApp.close()
})

test("electron apis", async () => {
  const userDataPath = await electronApp.evaluate(({ app }) =>
    app.getPath("userData"),
  )

  expect(
    await window.locator('[data-testid="user-data-path"]').textContent(),
  ).toBe(userDataPath)
})

test("scripts", async () => {
  const counter = window.locator("[data-testid='counter']")
  expect(await counter.textContent()).toBe("0")
  await counter.click({ clickCount: 2 })
  expect(await counter.textContent()).toBe("2")
})

test("action referrer redirect", async () => {
  await window.goto("http://localhost/referrer-redirect/form")

  const redirectCount = window.locator("[data-testid=redirects]")
  await expect(redirectCount).toHaveText("0")
  await window.click("text=submit")
  await expect(redirectCount).toHaveText("1")
})
