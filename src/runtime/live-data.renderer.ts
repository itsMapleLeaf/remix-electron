import { useLocation } from "@remix-run/react"
import type { DataFunctionArgs } from "@remix-run/server-runtime"
import type { IpcRendererEvent } from "electron"
import { useEffect, useState } from "react"

export type LiveDataFunctionArgs<PublishData> = DataFunctionArgs & {
  publish: (data: PublishData) => void
}

export type LiveDataFunction<PublishData> = (
  args: LiveDataFunctionArgs<PublishData>,
) => LiveDataCleanupFunction | void | undefined

export type LiveDataCleanupFunction = () => void

export type UseLiveDataOptions = {
  source?: string
}

export function useLiveData<T>({
  source: sourceOption,
}: UseLiveDataOptions = {}) {
  const [data, setData] = useState<T>()
  const location = useLocation()
  const source = sourceOption ?? location.pathname

  useEffect(() => {
    const url = new URL(source, "http://localhost/")
    url.searchParams.append("_liveData", "")
    fetch(url.toString(), { method: "POST" }).catch((error) => {
      console.warn("[remix-electron]", error)
    })
  }, [source])

  useEffect(() => {
    const { ipcRenderer } = window.require("electron")

    const channel = `remix-live-data:${source}`
    const handler = (_event: IpcRendererEvent, data: T) => setData(data)

    ipcRenderer.on(channel, handler)
    return () => {
      ipcRenderer.off(channel, handler)
    }
  }, [source])

  return data
}
