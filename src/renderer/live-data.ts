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

export function useLiveData<T>(): T | undefined {
  const [data, setData] = useState<T>()
  const location = useLocation()

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
