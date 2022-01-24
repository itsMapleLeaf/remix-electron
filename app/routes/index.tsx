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
    </div>
  )
}
