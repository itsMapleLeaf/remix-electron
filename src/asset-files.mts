import { createReadableStreamFromReadable } from "@remix-run/node"
import mime from "mime"
import fs from "node:fs"
import path from "node:path"

export async function serveAsset(
	request: Request,
	publicFolder: string,
): Promise<Response | undefined> {
	const url = new URL(request.url)
	const fullFilePath = path.join(publicFolder, decodeURIComponent(url.pathname))
	if (!fullFilePath.startsWith(publicFolder)) return

	const stat = await fs.promises.stat(fullFilePath).catch(() => undefined)
	if (!stat?.isFile()) return

	const headers = new Headers()

	const mimeType = mime.getType(fullFilePath)
	if (mimeType) headers.set("Content-Type", mimeType)

	const stream = createReadableStreamFromReadable(
		fs.createReadStream(fullFilePath),
	)

	return new Response(stream, {
		headers,
	})
}
