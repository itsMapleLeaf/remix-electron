const mime = require("mime")
const fs = require("node:fs")
const path = require("node:path")

/**
 * @param {Electron.ProtocolRequest} request
 * @param {string} publicFolder
 * @returns {Promise<Electron.ProtocolResponse | undefined>}
 */
exports.serveAsset = async function serveAsset(request, publicFolder) {
  const url = new URL(request.url)

  const fullFilePath = path.join(publicFolder, url.pathname)
  if (!fullFilePath.startsWith(publicFolder)) return

  const stat = await fs.promises.stat(fullFilePath).catch(() => undefined)
  if (!stat?.isFile()) return

  return {
    data: fs.createReadStream(fullFilePath),
    mimeType: mime.getType(fullFilePath) ?? undefined,
  }
}
