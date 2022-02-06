// @ts-check
const { app, protocol } = require("electron")
const { createRequestHandler } = require("@remix-run/server-runtime")
const { Request, Response, Headers } = require("@remix-run/node")
const { relative, join } = require("path")
const { stat, readFile } = require("fs/promises")
const mime = require("mime")

// need to declare these globally, otherwise remix errors
// @ts-expect-error
globalThis.Request = Request
// @ts-expect-error
globalThis.Response = Response
// @ts-expect-error
globalThis.Headers = Headers

const publicFolder = join(__dirname, "../public")
const serverBuildFolder = join(__dirname, "build")
const mode = app.isPackaged ? "production" : process.env.NODE_ENV

exports.registerRemixProtocolAsPriviledged =
  function registerRemixProtocolAsPriviledged() {
    protocol.registerSchemesAsPrivileged([
      { scheme: "remix", privileges: { secure: true, standard: true } },
    ])
  }

exports.registerRemixProtocol = function registerRemixProtocol() {
  protocol.registerStringProtocol("remix", async (request, callback) => {
    try {
      if (mode === "development") {
        purgeRequireCache()
      }

      const assetResponse = await tryServeFile(request)
      if (assetResponse) {
        callback(assetResponse)
        return
      }

      callback(await serveRemixResponse(request))
    } catch (error) {
      callback({
        statusCode: 500,
        data: `<pre>${error.stack || error.message || String(error)}</pre>`,
      })
      console.warn(error)
    }
  })
}

/**
 * @param {Electron.ProtocolRequest} request
 */
async function tryServeFile(request) {
  const url = new URL(request.url)
  const filePath = join(publicFolder, url.pathname)
  if (!(await isFile(filePath))) return

  return {
    data: await readFile(filePath, "utf-8"),
    mimeType: mime.getType(filePath),
  }
}

/**
 * @param {Electron.ProtocolRequest} request
 * @returns {Promise<Electron.ProtocolResponse>}
 */
async function serveRemixResponse(request) {
  const remixRequest = new Request(request.url, {
    method: request.method,
    headers: request.headers,
  })

  remixRequest.headers.set("referrer", request.referrer)

  // TODO: add uploadData to request as FormData

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
      "connect-src ws:",
      "base-uri 'self'",
    ].join("; "),
  )

  return {
    data: await response.text(),
    headers: Object.fromEntries(response.headers),
    statusCode: response.status,
    mimeType: response.headers.get("content-type"),
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
