import { useLoaderData } from "@remix-run/react"
import { app } from "~/electron.server"

export function loader() {
  return {
    userDataPath: app.getPath("userData"),
  }
}

export default function Index() {
  const data = useLoaderData<typeof loader>()
  return (
    <main>
      <h1>Welcome to Remix</h1>
      <p>{data.userDataPath}</p>
    </main>
  )
}
