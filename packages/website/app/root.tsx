import {
  Links,
  LiveReload,
  Meta,
  Outlet,
  Scripts,
  ScrollRestoration,
} from "@remix-run/react"
import type { LinksFunction, MetaFunction } from "@remix-run/server-runtime"
import tailwindCss from "./tailwind.css"

export const meta: MetaFunction = () => ({
  // eslint-disable-next-line unicorn/text-encoding-identifier-case
  charset: "utf-8",
  title: "New Remix App",
  viewport: "width=device-width,initial-scale=1",
})

export const links: LinksFunction = () => [
  { rel: "stylesheet", href: tailwindCss },
]

export default function App() {
  return (
    <html lang="en" className="bg-gray-900 text-gray-50">
      <head>
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
