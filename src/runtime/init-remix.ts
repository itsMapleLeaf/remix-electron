import type { ServerBuild } from "@remix-run/server-runtime"
import { createRequestHandler } from "@remix-run/server-runtime"
import { matchServerRoutes } from "@remix-run/server-runtime/routeMatching"
import { createRoutes } from "@remix-run/server-runtime/routes"
import { app, BrowserWindow, protocol } from "electron"
import { stat } from "node:fs/promises"
import { join } from "node:path"
import { asAbsolutePath } from "../helpers/as-absolute-path"
import { collectAssetFiles, serveAsset } from "../helpers/asset-files"
import { serveRemixResponse } from "./serve-remix-response"

export type ConfigureOptions = {
  getLoadContext?: (request: Electron.ProtocolRequest) => unknown
}

export async function initRemix(options: ConfigureOptions = {}) {
  const projectRoot = process.cwd()
  const serverBuildFile = join(projectRoot, "build/server.cjs")
  const publicFolder = join(projectRoot, "public")
  const mode = process.env.NODE_ENV || "development"

  let [assetFiles] = await Promise.all([
    collectAssetFiles(publicFolder),
    app.whenReady(),
  ])

  let serverBuild: ServerBuild = require(serverBuildFile)
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

      const context = await options.getLoadContext?.(request)
      const requestHandler = createRequestHandler(serverBuild, mode)

      const response =
        (await serveAsset(request, assetFiles)) ??
        (await serveRemixResponse(request, requestHandler, context))

      callback(response)

      // run matching live data functions
      const matches = matchServerRoutes(
        createRoutes(serverBuild.routes),
        new URL(request.url).pathname,
      )
      if (!matches?.length) return

      for (const match of matches) {
        // @ts-expect-error: need to type liveData
        const liveDataFunction = match.route.module.liveData
        if (typeof liveDataFunction !== "function") continue

        const generator: AsyncGenerator = liveDataFunction()

        void (async function () {
          try {
            for await (const data of generator) {
              const windows = BrowserWindow.getAllWindows()
              for (const win of windows) {
                win.webContents.send(`remix-live-data:${match.pathname}`, data)
              }
            }
          } catch (error) {
            console.error("Live data error:", error)
          }
        })()
      }
    } catch (error) {
      console.warn("[remix-electron]", error)

      const { stack, message } = toError(error)
      callback({
        statusCode: 500,
        data: `<pre>${stack || message}</pre>`,
      })
    }
  })
}

function purgeRequireCache(prefix: string) {
  for (const key in require.cache) {
    if (key.startsWith(prefix)) {
      delete require.cache[key]
    }
  }
}

function toError(error: unknown): Error {
  return error instanceof Error ? error : new Error(String(error))
}
