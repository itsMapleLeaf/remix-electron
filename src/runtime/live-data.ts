import { useLocation } from "@remix-run/react"
import type { DataFunctionArgs, ServerBuild } from "@remix-run/server-runtime"
import type {
  IpcRendererEvent,
  ProtocolRequest,
  ProtocolResponse,
} from "electron"
import { useEffect, useState } from "react"
import { createRemixRequest } from "./serve-remix-response"

export type LiveDataFunctionArgs<PublishData> = DataFunctionArgs & {
  publish: (data: PublishData) => void
}

export type LiveDataFunction<PublishData> = (
  args: LiveDataFunctionArgs<PublishData>,
) => LiveDataCleanupFunction | void | undefined

export type LiveDataCleanupFunction = () => void

type LiveDataEffect = {
  running: boolean
  cleanup?: LiveDataCleanupFunction | undefined | void
}

const liveDataEffects = new Map<string, LiveDataEffect>()

export async function serveLiveData(
  request: ProtocolRequest,
  serverBuild: ServerBuild,
  context: unknown,
): Promise<ProtocolResponse | undefined> {
  const { BrowserWindow } = require("electron")
  const { matchServerRoutes } = await import(
    "@remix-run/server-runtime/routeMatching.js"
  )
  const { createRoutes } = await import("@remix-run/server-runtime/routes.js")

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

export function useLiveData<T>(): T | undefined {
  const [data, setData] = useState<T>()
  const location = useLocation()

  useEffect(() => {
    fetch(`${location.pathname}?_liveData=true`, { method: "POST" }).catch(
      (error) => {
        console.warn("[remix-electron]", error)
      },
    )
  }, [location.pathname])

  useEffect(() => {
    const { ipcRenderer } = window.require("electron")

    const channel = `remix-live-data:${location.pathname}`
    const handler = (_event: IpcRendererEvent, data: T) => setData(data)

    ipcRenderer.on(channel, handler)
    return () => {
      ipcRenderer.off(channel, handler)
    }
  }, [location.pathname])

  return data
}
