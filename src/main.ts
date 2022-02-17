import type { AppConfig } from "@remix-run/dev/config"
import type { RequestHandler } from "@remix-run/server-runtime"
import { createRequestHandler } from "@remix-run/server-runtime"
import { app, protocol } from "electron"
import { asAbsolutePath } from "./as-absolute-path"
import type { AssetFile } from "./asset-files"
import { collectAssetFiles, serveAsset } from "./asset-files"
import "./browser-globals"

const defaultMode = app.isPackaged
  ? "production"
  : process.env.NODE_ENV === "production"
  ? "production"
  : "development"

const defaultServerBuildDirectory = "build"

export type GetLoadContextFunction = (
  request: Electron.ProtocolRequest,
) => unknown

export type InitRemixOptions = {
  mode?: "development" | "production"
  publicFolder?: string
  remixConfig: AppConfig
  getLoadContext?: GetLoadContextFunction
}

export async function initRemix({
  remixConfig,
  mode = defaultMode,
  publicFolder = "public",
  getLoadContext,
}: InitRemixOptions) {
  await app.whenReady()

  protocol.interceptBufferProtocol("http", async (request, callback) => {
    try {
      const serverBuildPath = asAbsolutePath(
        remixConfig.serverBuildPath ??
          remixConfig.serverBuildDirectory ??
          defaultServerBuildDirectory,
      )

      // purging the require cache is necessary for changes to show with hot reloading
      if (mode === "development") {
        purgeRequireCache(serverBuildPath)
      }

      const context = await getLoadContext?.(request)
      const assetFiles = await collectAssetFiles(publicFolder)
      const build = require(serverBuildPath)
      const requestHandler = createRequestHandler(build, {}, mode)

      callback(
        await handleRequest(request, assetFiles, requestHandler, context),
      )
    } catch (error) {
      console.warn("[remix-electron]", error)
      callback({
        statusCode: 500,
        // @ts-expect-error
        data: `<pre>${error?.stack || error?.message || String(error)}</pre>`,
      })
    }
  })

  return `http://app/`
}

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

async function serveRemixResponse(
  request: Electron.ProtocolRequest,
  handleRequest: RequestHandler,
  context: unknown,
): Promise<Electron.ProtocolResponse> {
  const init: RequestInit = {
    method: request.method,
    headers: request.headers,
    referrer: request.referrer,
  }

  if (request.uploadData) {
    // concat might not be correct but 🤷
    init.body = Buffer.concat(request.uploadData.map((data) => data.bytes))
  }

  const remixRequest = new Request(request.url, init)
  const response = await handleRequest(remixRequest, context)

  const headers: Record<string, string[]> = {}
  for (const [key, value] of response.headers) {
    const values = (headers[key] ??= [])
    values.push(value)
  }

  return {
    data: Buffer.from(await response.arrayBuffer()),
    headers,
    statusCode: response.status,
  }
}

function purgeRequireCache(prefix: string) {
  for (const key in require.cache) {
    if (key.startsWith(asAbsolutePath(prefix))) {
      delete require.cache[key]
    }
  }
}
