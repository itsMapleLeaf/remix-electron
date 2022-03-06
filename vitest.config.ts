import { configDefaults, defineConfig } from "vitest/config"

const exclude = [...configDefaults.exclude!]

if (process.platform !== "linux") {
  console.info("Skipping build test on non-linux platform")
  exclude.push("tests/build.test.ts")
}

export default defineConfig({
  test: {
    threads: false,
    include: ["{src,tests}/**/*.test.{ts,tsx}"],
    exclude,
  },
})
