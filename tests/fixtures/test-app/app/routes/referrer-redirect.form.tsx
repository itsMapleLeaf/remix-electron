import { useFetcher, useSearchParams } from "@remix-run/react";

export default function RedirectForm() {
  const fetcher = useFetcher()
  const [params] = useSearchParams()
  const redirects = params.get("redirects")
  return (
    <>
      <p data-testid="redirects">{redirects ?? 0}</p>
      <fetcher.Form
        action="/referrer-redirect/action"
        method="post"
        replace
        data-testid="referrer-form"
      >
        <button type="submit" name="redirects" value={redirects ?? 0}>
          submit
        </button>
      </fetcher.Form>
    </>
  )
}
