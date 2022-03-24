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
