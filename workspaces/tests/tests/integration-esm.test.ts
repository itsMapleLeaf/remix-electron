import { run } from "./integration.js"

export const appFolder = new URL("../../test-app-esm", import.meta.url)

run("esm", appFolder)
