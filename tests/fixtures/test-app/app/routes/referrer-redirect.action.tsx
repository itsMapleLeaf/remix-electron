import type { ActionFunction } from "remix"
import { redirect } from "remix"

export const action: ActionFunction = async ({ request }) => {
  const { redirects } = Object.fromEntries(await request.formData())
  const url = new URL(request.headers.get("referer")!)
  url.searchParams.set("redirects", String(Number(redirects) + 1))
  return redirect(url.toString())
}
