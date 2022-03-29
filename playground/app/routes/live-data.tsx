import { useEffect, useState } from "react"
import { useLocation } from "react-router-dom"
import { counter } from "../counter.server"

type LiveData = {
  count: number
}

export async function* liveData(): AsyncGenerator<LiveData> {
  for await (const count of counter()) {
    yield { count }
  }
}

export default function LiveDataPage() {
  const { count = 0 } = useLiveData<LiveData>() ?? {}
  return <p>this page has been running for {count} seconds</p>
}

function useLiveData<T>(): T | undefined {
  const [data, setData] = useState<T>()
  const location = useLocation()

  useEffect(() => {
    const { ipcRenderer } = window.require("electron")

    const channel = `remix-live-data:${location.pathname}`
    const handler = (_event: Electron.IpcRendererEvent, data: T) =>
      setData(data)

    ipcRenderer.on(channel, handler)
    return () => {
      ipcRenderer.off(channel, handler)
    }
  }, [location.pathname])

  return data
}
