import type {
  AppLoadContext,
  RequestHandler,
  ServerBuild,
} from "@remix-run/server-runtime"
import { createRequestHandler } from "@remix-run/server-runtime"
import { app, protocol } from "electron"
import { asAbsolutePath } from "./as-absolute-path"
import type { AssetFile } from "./asset-files"
import { collectAssetFiles, serveAsset } from "./asset-files"
import "./browser-globals"
import { serveRemixResponse } from "./serve-remix-response"

const defaultMode = app.isPackaged ? "production" : process.env.NODE_ENV

export type GetLoadContextFunction = (
  request: Electron.ProtocolRequest,
) => AppLoadContext | undefined | Promise<AppLoadContext | undefined>

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
  if (mode === "development") {
    return `http://localhost:3000/`
  }

  const appRoot = app.getAppPath()
  const publicFolder = asAbsolutePath(publicFolderOption, appRoot)

  const serverBuild =
    typeof serverBuildOption === "string"
      ? // eslint-disable-next-line @typescript-eslint/no-var-requires
        (require(serverBuildOption) as ServerBuild)
      : serverBuildOption

  const [assetFiles] = await Promise.all([
    collectAssetFiles(publicFolder),
    app.whenReady(),
  ])

  // eslint-disable-next-line @typescript-eslint/no-misused-promises
  protocol.interceptStreamProtocol("http", async (request, callback) => {
    try {
      const context = await getLoadContext?.(request)
      const requestHandler = createRequestHandler(serverBuild, mode)

      callback(
        await handleRequest(request, assetFiles, requestHandler, context),
      )
    } catch (error) {
      console.warn("[remix-electron]", error)
      const { stack, message } = toError(error)
      callback({
        statusCode: 500,
        data: `<pre>${stack || message}</pre>`,
      })
    }
  })

  return `http://localhost/`
}

async function handleRequest(
  request: Electron.ProtocolRequest,
  assetFiles: AssetFile[],
  requestHandler: RequestHandler,
  context: AppLoadContext | undefined,
): Promise<Electron.ProtocolResponse> {
  return (
    serveAsset(request, assetFiles) ??
    (await serveRemixResponse(request, requestHandler, context))
  )
}

function toError(value: unknown) {
  return value instanceof Error ? value : new Error(String(value))
}
