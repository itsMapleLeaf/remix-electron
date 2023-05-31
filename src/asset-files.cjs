const glob = require("fast-glob")
const mime = require("mime")
const { createReadStream } = require("node:fs")
const { readFile } = require("node:fs/promises")
const { relative } = require("node:path")

/**
 * @typedef {object} AssetFile
 * @property {string} path
 * @property {() => Promise<string | Buffer>} content
 * @property {() => import('node:stream').Readable} stream
 */

/**
 * @param {string} folder
 * @returns {Promise<AssetFile[]>} */
exports.collectAssetFiles = async function collectAssetFiles(folder) {
  const files = await glob("**/*", {
    cwd: folder,
    onlyFiles: true,
    absolute: true,
  })

  return files.map((file) => ({
    path: "/" + relative(folder, file).replaceAll("\\", "/"),
    content: () => readFile(file),
    stream: () => createReadStream(file),
  }))
}

/**
 * @param {Electron.ProtocolRequest} request
 * @param {AssetFile[]} files
 * @returns {Electron.ProtocolResponse | undefined}
 */
exports.serveAsset = function serveAsset(request, files) {
  const url = new URL(request.url)

  const file = files.find((file) => file.path === url.pathname)
  if (!file) return

  return {
    data: file.stream(),
    mimeType: mime.getType(file.path) ?? undefined,
  }
}
