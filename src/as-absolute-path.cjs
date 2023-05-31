const { isAbsolute, join } = require("node:path")

/**
 * @param {string} filePath
 * @param {string} workingDirectory
 */
exports.asAbsolutePath = function asAbsolutePath(filePath, workingDirectory) {
  return isAbsolute(filePath) ? filePath : join(workingDirectory, filePath)
}
