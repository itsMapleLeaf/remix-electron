import type { RequestHandler } from "@remix-run/server-runtime"
import { createRequestHandler } from "@remix-run/server-runtime"
import { app, protocol } from "electron"
import { stat } from "node:fs/promises"
import { join } from "node:path"
import { asAbsolutePath } from "./as-absolute-path"
import type { AssetFile } from "./asset-files"
import { collectAssetFiles, serveAsset } from "./asset-files"
import { serveRemixResponse } from "./serve-remix-response"

const projectRoot = process.cwd()
const serverBuildFile = join(projectRoot, "build/server.cjs")
const publicFolder = join(projectRoot, "public")
const mode = process.env.NODE_ENV || "development"

let [assetFiles] = await Promise.all([
  collectAssetFiles(publicFolder),
  app.whenReady(),
])

let serverBuild = require(serverBuildFile)
let lastBuildTime = 0

protocol.interceptBufferProtocol("http", async (request, callback) => {
  try {
    if (mode === "development") {
      assetFiles = await collectAssetFiles(publicFolder)
    }

    let buildTime = 0
    if (mode === "development" && serverBuildFile !== undefined) {
      const buildStat = await stat(serverBuildFile)
      buildTime = buildStat.mtimeMs
    }

    if (mode === "development" && lastBuildTime !== buildTime) {
      purgeRequireCache(asAbsolutePath(serverBuildFile))
      serverBuild = require(serverBuildFile)
      lastBuildTime = buildTime
    }

    const context = await getLoadContext?.(request)
    const requestHandler = createRequestHandler(serverBuild, {}, mode)

    callback(await handleRequest(request, assetFiles, requestHandler, context))
  } catch (error) {
    console.warn("[remix-electron]", error)
    callback({
      statusCode: 500,
      // @ts-expect-error
      data: `<pre>${error?.stack || error?.message || String(error)}</pre>`,
    })
  }
})

async function handleRequest(
  request: Electron.ProtocolRequest,
  assetFiles: AssetFile[],
  requestHandler: RequestHandler,
  context: unknown,
): Promise<Electron.ProtocolResponse> {
  return (
    (await serveAsset(request, assetFiles)) ??
    (await serveRemixResponse(request, requestHandler, context))
  )
}

function purgeRequireCache(prefix: string) {
  for (const key in require.cache) {
    if (key.startsWith(prefix)) {
      delete require.cache[key]
    }
  }
}
