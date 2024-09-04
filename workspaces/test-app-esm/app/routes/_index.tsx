import { useLoaderData } from "@remix-run/react"
import { useState } from "react"
import electron from "~/electron.server"

export function loader() {
	return {
		userDataPath: electron.app.getPath("userData"),
	}
}

export default function Index() {
	const data = useLoaderData<typeof loader>()
	const [count, setCount] = useState(0)
	return (
		<div style={{ fontFamily: "system-ui, sans-serif", lineHeight: "1.4" }}>
			<h1>Welcome to Remix</h1>
			<p data-testid="user-data-path">{data.userDataPath}</p>
			<button
				type="button"
				data-testid="counter"
				onClick={() => setCount(count + 1)}
			>
				{count}
			</button>
		</div>
	)
}
