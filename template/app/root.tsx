import type { LinksFunction, MetaFunction } from "@remix-run/node"
import {
	Links,
	LiveReload,
	Meta,
	Outlet,
	Scripts,
	ScrollRestoration,
} from "@remix-run/react"
import styles from "./styles.css"

export const meta: MetaFunction = () => [{ title: "New Remix App" }]

export const links: LinksFunction = () => [{ rel: "stylesheet", href: styles }]

export default function App() {
	return (
		<html lang="en">
			<head>
				<meta charSet="utf8" />
				<meta name="viewport" content="width=device-width,initial-scale=1" />
				<Meta />
				<Links />
			</head>
			<body>
				<Outlet />
				<ScrollRestoration />
				<Scripts />
				<LiveReload />
			</body>
		</html>
	)
}
