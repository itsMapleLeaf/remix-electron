const {
  AbortController,
  fetch,
  FormData,
  Headers,
  Request,
  Response,
} = require("@remix-run/node")

Object.assign(globalThis, {
  Request,
  Response,
  Headers,
  fetch,
  FormData,
  AbortController,
})

if (globalThis.ReadableStream === undefined) {
  const { ReadableStream } = require("@remix-run/web-stream")
  globalThis.ReadableStream = ReadableStream
}
