import type { ActionFunction } from "@remix-run/node"
import { redirect } from "@remix-run/node"

export const action: ActionFunction = async ({ request }) => {
	const { redirects } = Object.fromEntries(await request.formData())
	const referrer = request.headers.get("referer")
	if (!referrer) {
		throw new Error("No referrer header")
	}
	const url = new URL(referrer)
	url.searchParams.set("redirects", String(Number(redirects) + 1))
	return redirect(url.toString())
}
