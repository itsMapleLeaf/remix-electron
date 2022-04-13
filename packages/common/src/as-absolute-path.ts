import { isAbsolute, join } from "node:path"

export function asAbsolutePath(filePath: string): string {
  return isAbsolute(filePath) ? filePath : join(process.cwd(), filePath)
}
