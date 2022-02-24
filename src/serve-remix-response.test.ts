import { describe, expect, it } from "vitest"
import "./browser-globals"
import { serveRemixResponse } from "./serve-remix-response"

describe("serveRemixResponse", () => {
  it("sets referer", async () => {
    const handler = (request: Request) => {
      expect(request.headers.get("Referer")).toEqual("http://localhost/def")

      // node-fetch 2 doesn't seem to support this property at all,
      // so neither will i
      // expect(request.referrer).toEqual("http://localhost/def")

      return Promise.resolve(new Response())
    }

    const mockRequest: Electron.ProtocolRequest = {
      method: "POST",
      url: "http://localhost/abc",
      headers: {},
      referrer: "http://localhost/def",
    }

    await serveRemixResponse(mockRequest, handler, {})
  })
})
