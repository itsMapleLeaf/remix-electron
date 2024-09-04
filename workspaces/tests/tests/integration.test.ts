import { run } from "./integration.js"

export const appFolder = new URL("../../test-app", import.meta.url)

run("cjs", appFolder)
