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

if (typeof globalThis.ReadableStream === "undefined") {
  const { ReadableStream } = require("@remix-run/web-stream")
  globalThis.ReadableStream = ReadableStream
}
