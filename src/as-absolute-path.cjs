const path = require("node:path")

/**
 * @param {string} filePath
 * @param {string} workingDirectory
 */
exports.asAbsolutePath = function asAbsolutePath(filePath, workingDirectory) {
	return path.isAbsolute(filePath)
		? filePath
		: path.join(workingDirectory, filePath)
}
