import { execa } from "execa"
import type { ElectronApplication, Page } from "playwright"
import { _electron as electron } from "playwright"
import { afterAll, beforeAll, expect, test } from "vitest"
import { defineIntegration } from "./define-integration"
import { templateFolder } from "./paths"

defineIntegration(() => {
  let electronApp: ElectronApplication
  let window: Page

  beforeAll(async () => {
    await execa("pnpx", ["remix", "build"], {
      cwd: templateFolder,
    })

    electronApp = await electron.launch({
      cwd: templateFolder,
      args: ["."],
    })

    window = await electronApp.firstWindow()
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

  test("scripts/interactivity", async () => {
    const counter = window.locator("[data-testid='counter']")
    expect(await counter.textContent()).toBe("0")
    await counter.click({ clickCount: 2 })
    expect(await counter.textContent()).toBe("2")
  })
})
