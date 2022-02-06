import { useEffect, useState } from "react"
import { useLoaderData } from "remix"
import { app } from "~/electron.server"

export function loader() {
  return {
    version: app.getVersion(),
    appData: app.getPath("appData"),
  }
}

export default function Index() {
  const data = useLoaderData()
  return (
    <div style={{ fontFamily: "system-ui, sans-serif", lineHeight: "1.4" }}>
      <h1>Welcome to Remix (in Electron)</h1>
      <p>Version: {data.version}</p>
      <p>App data path: {data.appData}</p>
      <Uptime />
    </div>
  )
}

function Uptime() {
  const [seconds, setSeconds] = useState(0)
  useEffect(() => {
    const interval = setInterval(() => {
      setSeconds(seconds + 1)
    }, 1000)
    return () => clearInterval(interval)
  }, [])
  return <p>This app has been running for {seconds} seconds.</p>
}
