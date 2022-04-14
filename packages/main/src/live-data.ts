import type {
  LiveDataCleanupFunction,
  LiveDataFunction,
} from "@remix-electron/renderer"
import type { ServerBuild } from "@remix-run/server-runtime"
import { matchServerRoutes } from "@remix-run/server-runtime/routeMatching"
import { createRoutes } from "@remix-run/server-runtime/routes"
import type { ProtocolRequest, ProtocolResponse } from "electron"
import { BrowserWindow } from "electron"
import { createRemixRequest } from "./serve-remix-response"

type LiveDataEffect = {
  running: boolean
  cleanup?: LiveDataCleanupFunction | undefined | void
}

const liveDataEffects = new Map<string, LiveDataEffect>()

export function serveLiveData(
  request: ProtocolRequest,
  serverBuild: ServerBuild,
  context: unknown,
): ProtocolResponse | undefined {
  const url = new URL(request.url)
  if (!url.searchParams.has("_liveData")) return

  const matches = matchServerRoutes(
    createRoutes(serverBuild.routes),
    url.pathname,
  )

  for (const match of matches ?? []) {
    const existingEffect = liveDataEffects.get(match.route.id)
    if (existingEffect) {
      existingEffect.running = false
      existingEffect.cleanup?.()
    }

    const liveDataFunction: LiveDataFunction<unknown> | undefined = (
      match.route.module as any
    ).liveData

    if (typeof liveDataFunction !== "function") continue

    const cleanup = liveDataFunction({
      request: createRemixRequest(request),
      params: match.params,
      context,
      publish: (data) => {
        if (!effect.running) return
        for (const window of BrowserWindow.getAllWindows()) {
          window.webContents.send(`remix-live-data:${match.pathname}`, data)
        }
      },
    })

    const effect: LiveDataEffect = {
      running: true,
      cleanup,
    }

    liveDataEffects.set(match.route.id, effect)
  }

  if (matches?.length) {
    return {
      statusCode: 204,
      data: Buffer.of(),
    }
  }
}
