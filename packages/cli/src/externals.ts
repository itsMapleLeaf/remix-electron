import { loadPackageJSON } from "local-pkg"
import { builtinModules } from "node:module"

export async function getNodeExternals(projectRoot: string) {
  const packageJson = await loadPackageJSON(projectRoot)
  return [
    ...Object.keys(packageJson?.dependencies ?? {}),
    ...Object.keys(packageJson?.devDependencies ?? {}),
    ...builtinModules,
    ...builtinModules.map((name) => `node:${name}`),
    "electron",
    "remix-electron",
  ]
}
