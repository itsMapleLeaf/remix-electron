import { join } from "node:path"

export function getPreloadBuildFile(projectRoot: string) {
  return join(projectRoot, "build/preload.cjs")
}

export function getServerBuildFile(projectRoot: string) {
  return join(projectRoot, "build/server.cjs")
}
