import { defineConfig } from "tsup"

export default defineConfig({
	entry: ["src/index.mts"],
	format: ["cjs", "esm"],
	tsconfig: "tsconfig.root.json",
	dts: true,
	sourcemap: true,
})
