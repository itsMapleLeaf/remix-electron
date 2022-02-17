import { execa } from "execa"
import { join } from "node:path"
import type { ElectronApplication, Page } from "playwright"
import { _electron as electron } from "playwright"
import { afterAll, beforeAll, expect, test } from "vitest"

const appFolder = join(__dirname, "../template")

let electronApp: ElectronApplication
let window: Page

beforeAll(async () => {
  await execa("pnpm", ["build", "--", "--dir"], {
    cwd: appFolder,
  })

  electronApp = await electron.launch({
    cwd: appFolder,
    args: ["."],
    executablePath: join(
      appFolder,
      "dist/linux-unpacked/remix-electron-template",
    ),

    // this fixes a failure to launch on linux
    env: {
      DISPLAY: process.env.DISPLAY!,
    },
  })

  window = await electronApp.firstWindow()
}, 1000 * 60)

afterAll(async () => {
  await electronApp.close()
})

test("packaged build", async () => {
  expect(await window.locator("h1").textContent()).toBe("Welcome to Remix")
})
