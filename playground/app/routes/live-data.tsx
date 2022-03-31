import { Link } from "@remix-run/react"
import type { LiveDataFunction } from "remix-electron/renderer"
import { useLiveData } from "remix-electron/renderer"

type LiveData = {
  count: number
}

export const liveData: LiveDataFunction<LiveData> = ({ publish }) => {
  let count = 0
  const id = setInterval(() => {
    count += 1
    publish({ count })
  }, 1000)
  return () => clearInterval(id)
}

export default function LiveDataPage() {
  const { count = 0 } = useLiveData<LiveData>() ?? {}
  return (
    <main>
      <p>this page has been running for {count} seconds</p>
      <Link to="/">go back</Link>
    </main>
  )
}
