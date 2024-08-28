import * as webFetch from "@remix-run/web-fetch"

// only override the File global
// if we override everything else, we get errors caused by the mismatch of built-in types and remix types
global.File = webFetch.File

import { constants, access, watch } from "node:fs/promises"
import type { AppLoadContext, ServerBuild } from "@remix-run/node"
import { broadcastDevReady, createRequestHandler } from "@remix-run/node"
import { app, protocol } from "electron"
import { asAbsolutePath } from "./as-absolute-path.mjs"
import { serveAsset } from "./asset-files.mjs"

const getDefaultMode = () =>
	app.isPackaged ? "production" : process.env.NODE_ENV

type MaybePromise<T> = Promise<T> | T

type GetLoadContextFunction = (
	request: Request,
) => MaybePromise<AppLoadContext | undefined>

interface InitRemixOptions {
	serverBuild: ServerBuild | string
	mode?: string
	publicFolder?: string
	getLoadContext?: GetLoadContextFunction
	esm?: boolean
}

/**
 * Initialize and configure remix-electron
 *
 * @param options
 * @returns The url to use to access the app.
 */
export async function initRemix({
	serverBuild: serverBuildOption,
	mode,
	publicFolder: publicFolderOption = "public",
	getLoadContext,
	esm = typeof require === "undefined",
}: InitRemixOptions): Promise<string> {
	const publicFolder = asAbsolutePath(publicFolderOption, process.cwd())

	if (
		!(await access(publicFolder, constants.R_OK).then(
			() => true,
			() => false,
		))
	) {
		throw new Error(
			`Public folder ${publicFolder} does not exist. Make sure that the initRemix \`publicFolder\` option is configured correctly.`,
		)
	}

	const buildPath =
		typeof serverBuildOption === "string" ? serverBuildOption : undefined

	let serverBuild =
		typeof buildPath === "string"
			? /** @type {ServerBuild} */ await import(
					esm ? `${buildPath}?${Date.now()}` : buildPath
			  )
			: serverBuildOption

	await app.whenReady()

	protocol.handle("http", async (request) => {
		const url = new URL(request.url)
		if (
			// We only want to handle local (Remix) requests to port 80.
			// Requests to other hosts or ports should not be intercepted,
			// this might be the case when an application makes requests to a local service.
			!["localhost", "127.0.0.1"].includes(url.hostname) ||
			(url.port && url.port !== "80")
		) {
			return await fetch(request)
		}

		request.headers.append("Referer", request.referrer)
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
				if (esm) {
					serverBuild = await import(`${buildPath}?${Date.now()}`)
				} else {
					purgeRequireCache(buildPath)
					// eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
					serverBuild = require(buildPath)
				}
				await broadcastDevReady(serverBuild)
			}
		})()
	}

	// the remix web socket reads the websocket host from the browser url,
	// so this _has_ to be localhost
	return "http://localhost/"
}

function purgeRequireCache(prefix: string) {
	for (const key in require.cache) {
		if (key.startsWith(prefix)) {
			// eslint-disable-next-line @typescript-eslint/no-dynamic-delete
			delete require.cache[key]
		}
	}
}

function toError(value: unknown) {
	return value instanceof Error ? value : new Error(String(value))
}
