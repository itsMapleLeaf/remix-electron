import {
  AbortController,
  fetch,
  FormData,
  Headers,
  Request,
  Response,
} from "@remix-run/node"

Object.assign(globalThis, {
  Request,
  Response,
  Headers,
  fetch,
  FormData,
  AbortController,
})

if (globalThis.ReadableStream === undefined) {
  const { ReadableStream } =
    // eslint-disable-next-line @typescript-eslint/consistent-type-imports
    require("@remix-run/web-stream") as typeof import("@remix-run/web-stream")
  globalThis.ReadableStream = ReadableStream
}
