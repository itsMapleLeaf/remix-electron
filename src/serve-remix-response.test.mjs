import { describe, expect, it } from "vitest"
import "./browser-globals.cjs"
import { serveRemixResponse } from "./serve-remix-response.cjs"

describe("serveRemixResponse", () => {
  it("sets referer", async () => {
    /** @param {Request} request */
    const handler = (request) => {
      expect(request.headers.get("Referer")).toEqual("http://localhost/def")

      // node-fetch 2 doesn't seem to support this property at all,
      // so neither will i
      // expect(request.referrer).toEqual("http://localhost/def")

      return Promise.resolve(new Response())
    }

    /** @type {Electron.ProtocolRequest} */
    const mockRequest = {
      method: "POST",
      url: "http://localhost/abc",
      headers: {},
      referrer: "http://localhost/def",
    }

    await serveRemixResponse(mockRequest, handler, {})
  })
})
