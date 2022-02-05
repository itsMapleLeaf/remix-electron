const { createRequestHandler } = require("@remix-run/express")
const express = require("express")
const { join } = require("node:path")

const MODE = process.env.NODE_ENV
const BUILD_DIR = join(__dirname, "build")

const app = express()

// Normally there would be some caching headers here,
// but that's not necessary, as everything is served from the filesystem.
// + caching can make debugging harder sometimes
app.use(express.static(join(__dirname, "../public")))

if (MODE === "development") {
  app.use((req, res, next) => {
    purgeRequireCache()
    const build = require("./build")
    const handler = createRequestHandler({ build, mode: MODE })
    return handler(req, res, next)
  })
} else {
  app.use(createRequestHandler({ build: require("./build") }))
}

function purgeRequireCache() {
  // purge require cache on requests for "server side HMR" this won't let
  // you have in-memory objects between requests in development,
  // alternatively you can set up nodemon/pm2-dev to restart the server on
  // file changes, we prefer the DX of this though, so we've included it
  // for you by default
  for (const key in require.cache) {
    if (key.startsWith(BUILD_DIR)) {
      delete require.cache[key]
    }
  }
}

/**
 * @returns {Promise<{url:string}>}
 */
exports.startServer = function startServer() {
  return new Promise((resolve, reject) => {
    const port = process.env.PORT || 3000
    const url = `http://localhost:${port}`

    const server = app.listen(port, () => {
      console.info(`Express server listening on ${url}`)
      resolve({ url })
    })

    server.on("error", reject)
  })
}
