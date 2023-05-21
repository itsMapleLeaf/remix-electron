/* eslint-disable no-console */
import { execa } from "execa"
import { join } from "node:path"
import type { ElectronApplication, Page } from "playwright"
import { _electron as electron } from "playwright"
import { afterAll, beforeAll, expect, test } from "vitest"
import { templateFolder } from "./paths"

let electronApp: ElectronApplication
let window: Page

const getExecutablePath = () => {
  if (process.platform === "win32") {
    return join(templateFolder, "dist/win-unpacked/remix-electron-template.exe")
  }
  if (process.platform === "darwin") {
    return join(
      templateFolder,
      "dist/mac/remix-electron-template.app/Contents/MacOS/remix-electron-template",
    )
  }
  return join(templateFolder, "dist/linux-unpacked/remix-electron-template")
}

beforeAll(async () => {
  console.time("Building template")
  await execa("pnpm", ["run", "build", "--", "--dir"], {
    cwd: templateFolder,
  })
  console.timeEnd("Building template")

  console.time("Launching electron")
  electronApp = await electron.launch({
    executablePath: getExecutablePath(),
    env: { ...(process.env as { [key: string]: string }) },
  })
  console.timeEnd("Launching electron")

  console.time("Waiting for window")
  window = await electronApp.firstWindow()
  console.timeEnd("Waiting for window")
}, 1000 * 60 * 5)

afterAll(async () => {
  await electronApp.close()
})

test("packaged build", async () => {
  expect(await window.locator("h1").textContent()).toBe("Welcome to Remix")
})
