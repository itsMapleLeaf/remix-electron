import * as esbuild from "esbuild"
import { builtinModules as nodeBuiltins } from "node:module"
import { join } from "node:path"

const projectRoot = process.cwd()

export async function createElectronBuild() {
  await esbuild.build({
    entryPoints: [join(projectRoot, "app/entry.electron.tsx")],
    bundle: true,
    outfile: join(projectRoot, "build/main.cjs"),
    format: "cjs",
    platform: "node",
    external: [...nodeBuiltins, "electron", "remix-electron"],
    logLevel: "info",
    plugins: [],
    treeShaking: true,
    sourcemap: "external",
    inject: [join(__dirname, "../shims/react-shim.ts")],
  })
}
