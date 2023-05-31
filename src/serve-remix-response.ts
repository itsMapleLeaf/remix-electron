import type { AppLoadContext, RequestHandler } from "@remix-run/server-runtime"
import { ReadableStream } from "@remix-run/web-stream"
import { PassThrough, Readable } from "node:stream"
import "./browser-globals"

function createPassThroughStream(text: string | Buffer) {
  const readable = new PassThrough()
  readable.push(text)
  readable.push(null) // eslint-disable-line unicorn/no-null, unicorn/no-array-push-push
  return readable
}

export async function serveRemixResponse(
  request: Electron.ProtocolRequest,
  handleRequest: RequestHandler,
  context: AppLoadContext | undefined,
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
      data: Readable.from(
        response.body as unknown as AsyncIterable<Uint8Array>,
      ),
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
