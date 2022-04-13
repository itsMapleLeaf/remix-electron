import { join } from "node:path"

export function getProjectRoot() {
  // TODO: walk up the directory to find a remix-electron config file
  return process.cwd()
}

export function getPreloadBuildFile(projectRoot: string) {
  return join(projectRoot, "build/preload.cjs")
}

export function getServerBuildFile(projectRoot: string) {
  return join(projectRoot, "build/server.cjs")
}
