import { useLoaderData } from "remix"
import { app } from "~/electron.server"

export function loader() {
  return {
    version: app.getVersion(),
    homePath: app.getPath("home"),
  }
}

export default function Index() {
  const data = useLoaderData()
  return (
    <div style={{ fontFamily: "system-ui, sans-serif", lineHeight: "1.4" }}>
      <h1>Welcome to Remix (in Electron)</h1>
      <p>Version: {data.version}</p>
      <p>Home: {data.homePath}</p>
    </div>
  )
}
