import type { RequestHandler, ServerBuild } from "@remix-run/server-runtime"
import { createRequestHandler } from "@remix-run/server-runtime"
import { app, protocol } from "electron"
import { asAbsolutePath } from "./as-absolute-path"
import type { AssetFile } from "./asset-files"
import { collectAssetFiles, serveAsset } from "./asset-files"
import "./browser-globals"

const defaultMode = app.isPackaged ? "production" : process.env.NODE_ENV

export type GetLoadContextFunction = (
  request: Electron.ProtocolRequest,
) => unknown

export type InitRemixOptions = {
  /**
   * The path to the server build, or the server build itself.
   */
  serverBuild: ServerBuild | string

  /**
   * The mode to run the app in, either development or production
   * @default app.isPackaged ? "production" : process.env.NODE_ENV
   */
  mode?: string

  /**
   * The path where static assets are served from.
   * @default "public"
   */
  publicFolder?: string

  /**
   * A function to provide a `context` object to your loaders.
   */
  getLoadContext?: GetLoadContextFunction
}

export async function initRemix({
  serverBuild: serverBuildOption,
  mode = defaultMode,
  publicFolder = "public",
  getLoadContext,
}: InitRemixOptions) {
  let serverBuild: ServerBuild =
    typeof serverBuildOption === "string"
      ? require(serverBuildOption)
      : serverBuildOption

  let [assetFiles] = await Promise.all([
    collectAssetFiles(publicFolder),
    app.whenReady(),
  ])

  protocol.interceptBufferProtocol("http", async (request, callback) => {
    try {
      if (mode === "development") {
        assetFiles = await collectAssetFiles(publicFolder)
      }

      if (mode === "development" && typeof serverBuildOption === "string") {
        purgeRequireCache(asAbsolutePath(serverBuildOption))
        serverBuild = require(serverBuildOption)
      }

      const context = await getLoadContext?.(request)
      const requestHandler = createRequestHandler(serverBuild, {}, mode)

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

  // the remix web socket reads the websocket host from the browser url,
  // so this _has_ to be localhost
  return `http://localhost/`
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
    if (key.startsWith(prefix)) {
      delete require.cache[key]
    }
  }
}
