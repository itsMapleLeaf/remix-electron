import { useLoaderData } from "@remix-run/react"
import { getAppDataPath } from "~/electron.server"

export function loader() {
  return {
    userDataPath: getAppDataPath(),
  }
}

export default function Index() {
  const data = useLoaderData<typeof loader>()
  return (
    <main>
      <h1>Welcome to Remix :D</h1>
      <p>{data.userDataPath}</p>
    </main>
  )
}
