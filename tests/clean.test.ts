import { execa } from "execa"
import { stat } from "node:fs/promises"
import { join } from "node:path"
import { expect, test } from "vitest"
import { defineIntegration } from "./define-integration"
import { templateFolder } from "./paths"

defineIntegration(() => {
  test(
    "clean script",
    async () => {
      const buildFolders = [
        join(templateFolder, "dist"),
        join(templateFolder, "public/build"),
        join(templateFolder, "desktop/build"),
        join(templateFolder, ".cache"),
      ]

      await execa("pnpm", ["run", "build"], {
        cwd: templateFolder,
      })

      await Promise.all(
        buildFolders.map(async (path) => {
          const stats = await stat(path)
          expect(stats.isDirectory()).toBe(true)
        }),
      )

      await execa("pnpm", ["run", "clean"], {
        cwd: templateFolder,
      })

      await Promise.all(
        buildFolders.map(async (path) => {
          const stats = await stat(path).catch(() => undefined)
          expect(stats).toBe(undefined)
        }),
      )
    },
    1000 * 120,
  )
})
