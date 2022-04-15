import { isAbsolute, join } from "node:path"

export function asAbsolutePath(
  filePath: string,
  workingDirectory: string,
): string {
  return isAbsolute(filePath) ? filePath : join(workingDirectory, filePath)
}
