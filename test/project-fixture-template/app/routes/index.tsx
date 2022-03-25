import { useLoaderData } from "@remix-run/react"
import { app } from "electron"
import { useState } from "react"

export function loader() {
  return {
    userDataPath: app.getPath("userData"),
  }
}

export default function Index() {
  const data = useLoaderData()
  return (
    <div data-testid="app-loaded">
      <h1>Welcome to Remix</h1>
      <p>{data.userDataPath}</p>
      <Counter />
    </div>
  )
}

function Counter() {
  const [count, setCount] = useState(0)
  return (
    <button data-testid="counter" onClick={() => setCount(count + 1)}>
      {count}
    </button>
  )
}
