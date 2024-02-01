import { defineConfig } from "tsup";

export default defineConfig({
	entry: ["src/index.mts"],
	format: ["cjs", "esm"],
	dts: true,
	sourcemap: true,
});
