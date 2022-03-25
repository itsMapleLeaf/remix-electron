import { mkdir, stat, writeFile } from "node:fs/promises"
import { dirname } from "node:path"

export async function ensureWrite(file: string, content: string) {
  await mkdir(dirname(file), { recursive: true })
  await writeFile(file, content)
}

export async function isFolder(path: string) {
  const stats = await stat(path).catch(() => undefined)
  return stats?.isDirectory() ?? false
}
