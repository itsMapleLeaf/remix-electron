const {
	createRequestHandler,
	broadcastDevReady,
} = require("@remix-run/server-runtime")
const { app, protocol } = require("electron")
const { watch } = require("node:fs/promises")
const { asAbsolutePath } = require("./as-absolute-path.cjs")
const { serveAsset } = require("./asset-files.cjs")
const { serveRemixResponse } = require("./serve-remix-response.cjs")

const defaultMode = app.isPackaged ? "production" : process.env.NODE_ENV

/** @typedef {import("@remix-run/node").AppLoadContext} AppLoadContext */

/**
 * @typedef {(
 * 	request: Electron.ProtocolRequest,
 * ) => AppLoadContext | undefined | Promise<AppLoadContext | undefined>} GetLoadContextFunction
 */

/**
 * @typedef {object} InitRemixOptions
 * @property {import("@remix-run/node").ServerBuild | string} serverBuild The
 *   path to the server build, or the server build itself.
 * @property {string} [mode] The mode to run the app in, either development or
 *   production
 * @property {string} [publicFolder] The path where static assets are served
 *   from.
 * @property {GetLoadContextFunction} [getLoadContext] A function to provide a
 *   `context` object to your loaders.
 */

/**
 * Initialize and configure remix-electron
 *
 * @param {InitRemixOptions} options
 * @returns {Promise<string>} The url to use to access the app.
 */
exports.initRemix = async function initRemix({
	serverBuild: serverBuildOption,
	mode = defaultMode,
	publicFolder: publicFolderOption = "public",
	getLoadContext,
}) {
	const appRoot = app.getAppPath()
	const publicFolder = asAbsolutePath(publicFolderOption, appRoot)

	const buildPath =
		typeof serverBuildOption === "string"
			? require.resolve(serverBuildOption)
			: undefined

	let serverBuild =
		typeof serverBuildOption === "string"
			? require(serverBuildOption)
			: serverBuildOption

	await app.whenReady()

	// eslint-disable-next-line @typescript-eslint/no-misused-promises
	protocol.interceptStreamProtocol("http", async (request, callback) => {
		try {
			const context = await getLoadContext?.(request)
			const requestHandler = createRequestHandler(serverBuild, mode)
			callback(
				await handleRequest(request, publicFolder, requestHandler, context),
			)
		} catch (error) {
			console.warn("[remix-electron]", error)
			const { stack, message } = toError(error)
			callback({
				statusCode: 500,
				data: `<pre>${stack || message}</pre>`,
			})
		}
	})

	if (mode === "development" && typeof buildPath === "string") {
		;(async () => {
			for await (const _event of watch(buildPath)) {
				purgeRequireCache(buildPath)
				serverBuild = require(buildPath)
				broadcastDevReady(serverBuild)
			}
		})()
	}

	// the remix web socket reads the websocket host from the browser url,
	// so this _has_ to be localhost
	return `http://localhost/`
}

/**
 * @param {Electron.ProtocolRequest} request
 * @param {string} publicFolder
 * @param {import("@remix-run/node").RequestHandler} requestHandler
 * @param {AppLoadContext | undefined} context
 * @returns {Promise<Electron.ProtocolResponse>}
 */
async function handleRequest(request, publicFolder, requestHandler, context) {
	return (
		(await serveAsset(request, publicFolder)) ??
		(await serveRemixResponse(request, requestHandler, context))
	)
}

/** @param {string} prefix */
function purgeRequireCache(prefix) {
	for (const key in require.cache) {
		if (key.startsWith(prefix)) {
			delete require.cache[key]
		}
	}
}

/** @param {unknown} value */
function toError(value) {
	return value instanceof Error ? value : new Error(String(value))
}
