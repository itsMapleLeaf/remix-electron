import glob from "fast-glob"
import mime from "mime"
import { createReadStream } from "node:fs"
import { readFile } from "node:fs/promises"
import { relative } from "node:path"
import { type Readable } from "node:stream"

export type AssetFile = {
  path: string
  content: () => Promise<string | Buffer>
  stream: () => Readable
}

export async function collectAssetFiles(folder: string): Promise<AssetFile[]> {
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

export function serveAsset(
  request: Electron.ProtocolRequest,
  files: AssetFile[],
): Electron.ProtocolResponse | undefined {
  const url = new URL(request.url)

  const file = files.find((file) => file.path === url.pathname)
  if (!file) return

  return {
    data: file.stream(),
    mimeType: mime.getType(file.path) ?? undefined,
  }
}
