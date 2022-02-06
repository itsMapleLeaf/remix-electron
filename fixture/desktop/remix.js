const { app, protocol } = require("electron")
const { createRequestHandler } = require("@remix-run/server-runtime")
const {
  Request,
  Response,
  Headers,
  fetch,
  FormData,
  AbortController,
} = require("@remix-run/node")
const path = require("path")
const { stat, readFile } = require("fs/promises")
const mime = require("mime")

Object.assign(globalThis, {
  Request,
  Response,
  Headers,
  fetch,
  FormData,
  AbortController,
})

const publicFolder = path.join(__dirname, "../public")
const serverBuildFolder = path.join(__dirname, "build")
const mode = app.isPackaged ? "production" : process.env.NODE_ENV

exports.initRemix = function initRemix() {
  // this allows Remix's scripts to use the sessionStorage API,
  // and must be called *before* app ready
  protocol.registerSchemesAsPrivileged([
    { scheme: "remix", privileges: { secure: true, standard: true } },
  ])

  app.once("ready", () => {
    protocol.interceptBufferProtocol("http", async (request, callback) => {
      try {
        // purging the require cache is necessary for changes to show with hot reloading
        if (mode === "development") {
          purgeRequireCache()
        }

        const assetResponse = await tryServeAsset(request)
        if (assetResponse) {
          callback(assetResponse)
          return
        }

        callback(await serveRemixResponse(request))
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

/**
 * @param {Electron.ProtocolRequest} request
 * @returns {Promise<Electron.ProtocolResponse | undefined>}
 */
async function tryServeAsset(request) {
  const url = new URL(request.url)
  const filePath = path.join(publicFolder, url.pathname)
  if (!(await isFile(filePath))) return

  return {
    data: await readFile(filePath),
    mimeType: mime.getType(filePath) ?? undefined,
  }
}

/**
 * @param {Electron.ProtocolRequest} request
 * @returns {Promise<Electron.ProtocolResponse>}
 */
async function serveRemixResponse(request) {
  /** @type {import('@remix-run/node').RequestInit} */
  const init = {
    method: request.method,
    headers: request.headers,
  }

  if (request.uploadData) {
    init.body = Buffer.concat(request.uploadData.map((data) => data.bytes))
  }

  const remixRequest = new Request(request.url, init)
  remixRequest.headers.set("referrer", request.referrer)

  /** @type {any} */
  const build = require("./build")
  const handleRequest = createRequestHandler(build, {}, mode)
  // @ts-expect-error
  const response = await handleRequest(remixRequest)

  response.headers.append(
    "content-security-policy",
    [
      "default-src 'self'",
      "script-src 'self' 'unsafe-inline'",
      "style-src 'self' 'unsafe-inline'",
      "img-src http: https:",
      "connect-src http: https: remix: ws:",
      "base-uri 'self'",
    ].join("; "),
  )

  return {
    data: Buffer.from(await response.arrayBuffer()),
    headers: Object.fromEntries(response.headers),
    statusCode: response.status,
  }
}

/**
 * @param {import("fs").PathLike} path
 */
async function isFile(path) {
  const stats = await stat(path).catch(() => undefined)
  return stats?.isFile() ?? false
}

function purgeRequireCache() {
  for (const key in require.cache) {
    if (key.startsWith(serverBuildFolder)) {
      delete require.cache[key]
    }
  }
}
