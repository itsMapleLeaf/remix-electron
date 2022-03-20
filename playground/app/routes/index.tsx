import { app } from "electron"
import { useLoaderData } from "remix"

export function loader() {
  return {
    userDataPath: app.getPath("userData"),
  }
}

export default function Index() {
  const data = useLoaderData()
  return (
    <div style={{ fontFamily: "system-ui, sans-serif", lineHeight: "1.4" }}>
      <h1>Welcome to Remix</h1>
      <p>{data.userDataPath}</p>
    </div>
  )
}
