import path from "node:path"

export function asAbsolutePath(filePath: string, workingDirectory: string) {
	return path.isAbsolute(filePath)
		? filePath
		: path.join(workingDirectory, filePath)
}
