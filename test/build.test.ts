import { expect } from "@playwright/test"
import { execa } from "execa"
import glob from "fast-glob"
import { copyFile, mkdir, rm } from "node:fs/promises"
import { dirname, join } from "node:path"
import type { ElectronApplication, Page } from "playwright"
import { _electron as electron } from "playwright"
import { afterEach, beforeEach, test } from "vitest"

const templateFolder = join(__dirname, "project-fixture-template")
const fixtureFolder = join(__dirname, "build-fixture")

let app: ElectronApplication
let page: Page

beforeEach(async () => {
  const playgroundFiles = await glob("**/*", {
    cwd: templateFolder,
    onlyFiles: true,
    ignore: ["**/{node_modules,build,.cache}/**"],
  })

  await Promise.all(
    playgroundFiles.map(async (file) => {
      const destinationPath = join(fixtureFolder, file)
      await mkdir(dirname(destinationPath), { recursive: true })
      await copyFile(join(templateFolder, file), destinationPath)
    }),
  )

  await execa("pnpm", ["install"], { cwd: fixtureFolder })
  await execa("pnpm", ["run", "build"], { cwd: fixtureFolder })

  app = await electron.launch({
    cwd: fixtureFolder,
    args: ["."],
  })
  page = await app.firstWindow()
  await page.waitForEvent("domcontentloaded")
}, 15_000)

afterEach(async () => {
  await rm(fixtureFolder, { recursive: true, force: true })
}, 15_000)

afterEach(async () => {
  await app?.close()
}, 15_000)

test("counter", async () => {
  const counter = page.locator("[data-testid=counter]")
  await expect(counter).toHaveText("0")
  await counter.click()
  await expect(counter).toHaveText("1")
  await counter.click()
  await expect(counter).toHaveText("2")
})
