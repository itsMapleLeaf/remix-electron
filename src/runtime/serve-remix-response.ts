import type { RequestHandler } from "@remix-run/server-runtime"

export async function serveRemixResponse(
  request: Electron.ProtocolRequest,
  handleRequest: RequestHandler,
  context: unknown,
): Promise<Electron.ProtocolResponse> {
  const response = await handleRequest(createRemixRequest(request), context)

  const headers: Record<string, string[]> = {}
  for (const [key, value] of response.headers) {
    const values = (headers[key] ??= [])
    values.push(value)
  }

  return {
    data: Buffer.from(await response.arrayBuffer()),
    headers,
    statusCode: response.status,
  }
}

export function createRemixRequest(request: Electron.ProtocolRequest) {
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
  return remixRequest
}
