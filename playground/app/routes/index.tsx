import { Link, useLoaderData } from "@remix-run/react"
import { json } from "@remix-run/server-runtime"
import { app } from "electron"
import { useState } from "react"
import type { CustomDataFunctionArgs } from "../context"

type LoaderData = {
  userDataPath: string
  secret: string
}

export function loader({ context }: CustomDataFunctionArgs) {
  return json<LoaderData>({
    userDataPath: app.getPath("userData"),
    secret: context.secret,
  })
}

export default function Index() {
  const data = useLoaderData<LoaderData>()

  return (
    <div style={{ fontFamily: "system-ui, sans-serif", lineHeight: "1.4" }}>
      <h1>Welcome to Remix</h1>
      <p>{data.userDataPath}</p>
      <p>the secret is {data.secret}</p>
      <p>
        <Link to="/live-data">live data demo</Link>
      </p>
      <Counter />
    </div>
  )
}

function Counter() {
  const [count, setCount] = useState(0)
  return <button onClick={() => setCount(count + 1)}>{count}</button>
}
