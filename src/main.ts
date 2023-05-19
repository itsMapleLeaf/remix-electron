import type { RequestHandler, ServerBuild } from "@remix-run/server-runtime"
import { createRequestHandler } from "@remix-run/server-runtime"
import { app, protocol } from "electron"
import { stat } from "node:fs/promises"
import { asAbsolutePath } from "./as-absolute-path"
import type { AssetFile } from "./asset-files"
import { collectAssetFiles, serveAsset } from "./asset-files"
import "./browser-globals"
import { serveRemixResponse } from "./serve-remix-response"

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
  publicFolder: publicFolderOption = "public",
  getLoadContext,
}: InitRemixOptions) {
  const appRoot = app.getAppPath()
  const publicFolder = asAbsolutePath(publicFolderOption, appRoot)

  let serverBuild: ServerBuild =
    typeof serverBuildOption === "string"
      ? require(serverBuildOption)
      : serverBuildOption

  let [assetFiles] = await Promise.all([
    collectAssetFiles(publicFolder),
    app.whenReady(),
  ])

  let lastBuildTime = 0
  const buildPath =
    typeof serverBuildOption === "string"
      ? require.resolve(serverBuildOption)
      : undefined

  protocol.interceptStreamProtocol("http", async (request, callback) => {
    try {
      if (mode === "development") {
        assetFiles = await collectAssetFiles(publicFolder)
      }

      let buildTime = 0
      if (mode === "development" && buildPath !== undefined) {
        const buildStat = await stat(buildPath)
        buildTime = buildStat.mtimeMs
      }

      if (
        mode === "development" &&
        buildPath !== undefined &&
        lastBuildTime !== buildTime
      ) {
        purgeRequireCache(buildPath)
        serverBuild = require(buildPath)
        lastBuildTime = buildTime
      }

      const context = await getLoadContext?.(request)
      const requestHandler = createRequestHandler(serverBuild, mode)

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

function purgeRequireCache(prefix: string) {
  for (const key in require.cache) {
    if (key.startsWith(prefix)) {
      delete require.cache[key]
    }
  }
}
