import type { RequestHandler } from "@remix-run/server-runtime"
import { Readable, PassThrough } from "node:stream"
import "./browser-globals"

function createPassThroughStream(text: any) {
  const readable = new PassThrough()
  readable.push(text)
  readable.push(null) // eslint-disable-line unicorn/no-null, unicorn/no-array-push-push
  return readable
}

export async function serveRemixResponse(
  request: Electron.ProtocolRequest,
  handleRequest: RequestHandler,
  context: unknown,
): Promise<Electron.ProtocolResponse> {
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

  const headers: Record<string, string[]> = {}
  for (const [key, value] of response.headers) {
    const values = (headers[key] ??= [])
    values.push(value)
  }

  if (response.body instanceof ReadableStream) {
    return {
      // @ts-expect-error
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
