const mime = require("mime")
const fs = require("node:fs")
const path = require("node:path")
const { createReadableStreamFromReadable } = require("@remix-run/node")

/**
 * @param {Request} request
 * @param {string} publicFolder
 * @returns {Promise<Response | undefined>}
 */
exports.serveAsset = async function serveAsset(request, publicFolder) {
	const url = new URL(request.url)
	const fullFilePath = path.join(publicFolder, url.pathname)
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
