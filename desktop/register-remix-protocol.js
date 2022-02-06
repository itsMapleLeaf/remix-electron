// @ts-check
const { app, protocol } = require("electron")
const { createRequestHandler } = require("@remix-run/server-runtime")
const { Request, Response, Headers } = require("@remix-run/node")

// need to declare these globally, otherwise remix errors
// @ts-expect-error
globalThis.Request = Request
// @ts-expect-error
globalThis.Response = Response
// @ts-expect-error
globalThis.Headers = Headers

exports.registerRemixProtocol = function registerRemixProtocol() {
  /** @type {any} */
  const build = require("./build")

  const handleRequest = createRequestHandler(
    build,
    {},
    app.isPackaged ? "production" : process.env.NODE_ENV,
  )

  protocol.registerStringProtocol("remix", async (request, callback) => {
    try {
      const remixRequest = new Request(request.url, {
        method: request.method,
        headers: request.headers,
      })

      remixRequest.headers.set("referrer", request.referrer)

      // TODO: add uploadData to request as FormData
      // @ts-expect-error
      const response = await handleRequest(remixRequest)

      callback({
        data: await response.text(),
        headers: Object.fromEntries(response.headers),
        statusCode: response.status,
        url: response.url,
      })
    } catch (error) {
      callback({
        statusCode: 500,
        data: `<pre>${error.stack || error.message || String(error)}</pre>`,
      })
    }
  })
}
