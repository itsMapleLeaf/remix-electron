import { useState } from "react"
import { useLoaderData } from "@remix-run/react"
import { app } from "~/electron.server"

export function loader() {
  return {
    userDataPath: app.getPath("userData"),
  }
}

export default function Index() {
  const data = useLoaderData()
  const [count, setCount] = useState(0)
  return (
    <div style={{ fontFamily: "system-ui, sans-serif", lineHeight: "1.4" }}>
      <h1>Welcome to Remix</h1>
      <p data-testid="user-data-path">{data.userDataPath}</p>
      <button data-testid="counter" onClick={() => setCount(count + 1)}>
        {count}
      </button>
    </div>
  )
}
