require("./browser-globals.cjs")
const { createRequestHandler } = require("@remix-run/server-runtime")
const { app, protocol } = require("electron")
const { stat } = require("node:fs/promises")
const { asAbsolutePath } = require("./as-absolute-path.cjs")
const { collectAssetFiles, serveAsset } = require("./asset-files.cjs")
const { serveRemixResponse } = require("./serve-remix-response.cjs")

const defaultMode = app.isPackaged ? "production" : process.env.NODE_ENV

/**
 * @typedef {import("@remix-run/node").AppLoadContext} AppLoadContext
 */

/**
 * @typedef {(request: Electron.ProtocolRequest) => AppLoadContext | undefined | Promise<AppLoadContext | undefined>} GetLoadContextFunction
 */

/**
 * @typedef {object} InitRemixOptions
 * @property {import('@remix-run/node').ServerBuild | string} serverBuild The path to the server build, or the server build itself.
 * @property {string} [mode] The mode to run the app in, either development or production
 * @property {string} [publicFolder] The path where static assets are served from.
 * @property {GetLoadContextFunction} [getLoadContext] A function to provide a `context` object to your loaders.
 */

/**
 * @param {InitRemixOptions} options
 */
exports.initRemix = async function initRemix({
  serverBuild: serverBuildOption,
  mode = defaultMode,
  publicFolder: publicFolderOption = "public",
  getLoadContext,
}) {
  const appRoot = app.getAppPath()
  const publicFolder = asAbsolutePath(publicFolderOption, appRoot)

  let serverBuild =
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

  // eslint-disable-next-line @typescript-eslint/no-misused-promises
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
      const { stack, message } = toError(error)
      callback({
        statusCode: 500,
        data: `<pre>${stack || message}</pre>`,
      })
    }
  })

  // the remix web socket reads the websocket host from the browser url,
  // so this _has_ to be localhost
  return `http://localhost/`
}

/**
 * @param {Electron.ProtocolRequest} request
 * @param {import("./asset-files.cjs").AssetFile[]} assetFiles
 * @param {import('@remix-run/node').RequestHandler} requestHandler
 * @param {AppLoadContext | undefined} context
 * @returns {Promise<Electron.ProtocolResponse>}
 */
async function handleRequest(request, assetFiles, requestHandler, context) {
  return (
    serveAsset(request, assetFiles) ??
    (await serveRemixResponse(request, requestHandler, context))
  )
}

/** @param {string} prefix */
function purgeRequireCache(prefix) {
  for (const key in require.cache) {
    if (key.startsWith(prefix)) {
      delete require.cache[key]
    }
  }
}

/** @param {unknown} value */
function toError(value) {
  return value instanceof Error ? value : new Error(String(value))
}
