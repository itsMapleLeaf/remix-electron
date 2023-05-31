const { ReadableStream } = require("@remix-run/web-stream")
const { PassThrough, Readable } = require("node:stream")
require("./browser-globals.cjs")

/**
 * @param {string | Buffer} text
 */
function createPassThroughStream(text) {
  const readable = new PassThrough()
  readable.push(text)
  readable.push(null) // eslint-disable-line unicorn/no-null, unicorn/no-array-push-push
  return readable
}

/**
 * @param {Electron.ProtocolRequest} request
 * @param {import("@remix-run/node").RequestHandler} handleRequest
 * @param {import("@remix-run/node").AppLoadContext | undefined} context
 * @returns {Promise<Electron.ProtocolResponse>}
 */
exports.serveRemixResponse = async function serveRemixResponse(
  request,
  handleRequest,
  context,
) {
  const body = request.uploadData
    ? Buffer.concat(request.uploadData.map((data) => data.bytes))
    : undefined

  const remixHeaders = new Headers(request.headers)
  remixHeaders.append("Referer", request.referrer)

  const remixRequest = new Request(request.url, {
    method: request.method,
    headers: remixHeaders,
    body,
  })

  const response = await handleRequest(remixRequest, context)

  /** @type {Record<string, string[]>} */
  const headers = {}
  for (const [key, value] of response.headers) {
    const values = (headers[key] ??= [])
    values.push(value)
  }

  if (response.body instanceof ReadableStream) {
    return {
      // @ts-expect-error: Argument of type 'ReadableStream<Uint8Array>' is not assignable to parameter of type 'Iterable<any> | AsyncIterable<any>'.
      data: Readable.from(response.body),
      headers,
      statusCode: response.status,
    }
  }

  return {
    data: createPassThroughStream(Buffer.from(await response.arrayBuffer())),
    headers,
    statusCode: response.status,
  }
}
