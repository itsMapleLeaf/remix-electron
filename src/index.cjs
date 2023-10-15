// eslint-disable-next-line @typescript-eslint/prefer-ts-expect-error
// @ts-ignore: weird ESM error
const webFetch = require("@remix-run/web-fetch")

// only override the File global
// if we override everything else, we get errors caused by the mismatch of built-in types and remix types
global.File = webFetch.File

const { createRequestHandler, broadcastDevReady } = require("@remix-run/node")
const { app, protocol } = require("electron")
const { watch } = require("node:fs/promises")
const { asAbsolutePath } = require("./as-absolute-path.cjs")
const { serveAsset } = require("./asset-files.cjs")

const getDefaultMode = () =>
	app.isPackaged ? "production" : process.env.NODE_ENV

/** @typedef {import("@remix-run/node").AppLoadContext} AppLoadContext */
/** @typedef {import("@remix-run/node").ServerBuild} ServerBuild */

/**
 * @template T
 * @typedef {Promise<T> | T} MaybePromise
 */

/** @typedef {(request: Request) => MaybePromise<AppLoadContext | undefined>} GetLoadContextFunction */

/**
 * @typedef {object} InitRemixOptions
 * @property {ServerBuild | string} serverBuild The path to the server build, or
 *   the server build itself.
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
	mode,
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
			? /** @type {ServerBuild} */ (require(serverBuildOption))
			: serverBuildOption

	await app.whenReady()

	protocol.handle("http", async (request) => {
		try {
			const assetResponse = await serveAsset(request, publicFolder)
			if (assetResponse) {
				return assetResponse
			}

			const context = await getLoadContext?.(request)
			const handleRequest = createRequestHandler(
				serverBuild,
				mode ?? getDefaultMode(),
			)
			return await handleRequest(request, context)
		} catch (error) {
			console.warn("[remix-electron]", error)
			const { stack, message } = toError(error)
			return new Response(`<pre>${stack || message}</pre>`, {
				status: 500,
				headers: { "content-type": "text/html" },
			})
		}
	})

	if (
		(mode ?? getDefaultMode()) !== "production" &&
		typeof buildPath === "string"
	) {
		void (async () => {
			for await (const _event of watch(buildPath)) {
				purgeRequireCache(buildPath)
				// eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
				serverBuild = require(buildPath)
				await broadcastDevReady(serverBuild)
			}
		})()
	}

	// the remix web socket reads the websocket host from the browser url,
	// so this _has_ to be localhost
	return `http://localhost/`
}

/** @param {string} prefix */
function purgeRequireCache(prefix) {
	for (const key in require.cache) {
		if (key.startsWith(prefix)) {
			// eslint-disable-next-line @typescript-eslint/no-dynamic-delete
			delete require.cache[key]
		}
	}
}

/** @param {unknown} value */
function toError(value) {
	return value instanceof Error ? value : new Error(String(value))
}
