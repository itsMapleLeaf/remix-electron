import { defineConfig } from "vitest/config"

export default defineConfig({
  test: {
    threads: false,
    include: ["{src,tests}/**/*.test.{ts,tsx}"],
  },
})
