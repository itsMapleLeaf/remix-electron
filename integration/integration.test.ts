import { execa } from "execa"
import { join } from "node:path"
import type { ElectronApplication, Page } from "playwright"
import { _electron as electron } from "playwright"
import { afterAll, beforeAll, expect, test } from "vitest"

const appFolder = join(__dirname, "fixtures/main")

let electronApp: ElectronApplication
let window: Page

beforeAll(async () => {
  await execa("pnpm", ["build"], {
    cwd: appFolder,
    stdio: "inherit",
  })

  electronApp = await electron.launch({
    cwd: appFolder,
    args: ["."],

    // this fixes a failure to launch on linux
    env: {
      DISPLAY: process.env.DISPLAY!,
    },
  })

  window = await electronApp.firstWindow()
})

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

test("scripts/interactivity", async () => {
  const counter = window.locator("[data-testid='counter']")
  expect(await counter.textContent()).toBe("0")
  await counter.click({ clickCount: 2 })
  expect(await counter.textContent()).toBe("2")
})