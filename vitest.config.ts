import { defineConfig } from "vitest/config"

export default defineConfig({
  test: {
    threads: false,
    reporters: ["basic"],
  },
})
