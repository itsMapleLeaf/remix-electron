export function getRouteUrl(route: string) {
  try {
    return new URL(route, `http://localhost/`).href
  } catch {
    throw new Error(`Failed to parse route: "${route}"`)
  }
}
