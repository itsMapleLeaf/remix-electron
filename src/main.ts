import type { AppConfig } from "@remix-run/dev/config"
import { createRequestHandler } from "@remix-run/server-runtime"
import { app, protocol } from "electron"
import mime from "mime"
import type { PathLike } from "node:fs"
import { readFile, stat } from "node:fs/promises"
import path, { isAbsolute, join } from "node:path"
import "./browser-globals"

const defaultMode = app.isPackaged
  ? "production"
  : process.env.NODE_ENV === "production"
  ? "production"
  : "development"

const defaultServerBuildDirectory = "desktop/build"
const defaultAssetsBuildDirectory = "public/build"

export type InitRemixOptions = {
  mode?: "development" | "production"
  remixConfig: AppConfig
}

export function initRemix({
  remixConfig,
  mode = defaultMode,
}: InitRemixOptions) {
  app.once("ready", () => {
    protocol.interceptBufferProtocol("http", async (request, callback) => {
      try {
        // purging the require cache is necessary for changes to show with hot reloading
        if (defaultMode === "development") {
          purgeRequireCache(
            remixConfig.serverBuildDirectory ?? defaultServerBuildDirectory,
          )
        }

        const assetResponse = await serveAsset(request, remixConfig)
        if (assetResponse) {
          callback(assetResponse)
          return
        }

        callback(await serveRemixResponse(request, mode, remixConfig))
      } catch (error) {
        callback({
          statusCode: 500,
          // @ts-expect-error
          data: `<pre>${error?.stack || error?.message || String(error)}</pre>`,
        })
        console.warn(error)
      }
    })
  })
}

async function serveAsset(
  request: Electron.ProtocolRequest,
  remixConfig: AppConfig,
): Promise<Electron.ProtocolResponse | undefined> {
  const url = new URL(request.url)

  const assetsBuildDirectory = asAbsolutePath(
    remixConfig.assetsBuildDirectory ?? defaultAssetsBuildDirectory,
  )

  const filePath = path.join(assetsBuildDirectory, url.pathname)

  // make sure the request doesn't leave the assets directory
  if (!filePath.startsWith(assetsBuildDirectory)) {
    return
  }

  if (!(await isFile(filePath))) {
    return
  }

  return {
    data: await readFile(filePath),
    mimeType: mime.getType(filePath) ?? undefined,
  }
}

async function serveRemixResponse(
  request: Electron.ProtocolRequest,
  mode: "development" | "production",
  remixConfig: AppConfig,
): Promise<Electron.ProtocolResponse> {
  const init: RequestInit = {
    method: request.method,
    headers: request.headers,
  }

  if (request.uploadData) {
    // concat might not be correct but 🤷
    init.body = Buffer.concat(request.uploadData.map((data) => data.bytes))
  }

  const remixRequest = new Request(request.url, init)
  remixRequest.headers.set("referrer", request.referrer)

  const serverBuildFolder = asAbsolutePath(
    remixConfig.serverBuildDirectory ?? "desktop/build",
  )

  const build = require(serverBuildFolder)
  const handleRequest = createRequestHandler(build, {}, mode)
  const response = await handleRequest(remixRequest)

  return {
    data: Buffer.from(await response.arrayBuffer()),
    headers: Object.fromEntries(response.headers),
    statusCode: response.status,
  }
}

async function isFile(path: PathLike) {
  const stats = await stat(path).catch(() => undefined)
  return stats?.isFile() ?? false
}

function purgeRequireCache(prefix: string) {
  for (const key in require.cache) {
    if (key.startsWith(asAbsolutePath(prefix))) {
      delete require.cache[key]
    }
  }
}

function asAbsolutePath(filePath: string): string {
  return isAbsolute(filePath) ? filePath : join(process.cwd(), filePath)
}
