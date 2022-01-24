const { createRequestHandler } = require("@remix-run/express")
const compression = require("compression")
const express = require("express")
const morgan = require("morgan")
const { writeFileSync } = require("node:fs")
const { join } = require("node:path")

const MODE = process.env.NODE_ENV
const BUILD_DIR = join(__dirname, "build")

const app = express()
app.use(compression())

// You may want to be more aggressive with this caching
app.use(express.static("public", { maxAge: "1h" }))

// Remix fingerprints its assets so we can cache forever
app.use(express.static("public/build", { immutable: true, maxAge: "1y" }))

app.use(morgan("tiny"))
app.all(
  "*",
  MODE === "production"
    ? createRequestHandler({ build: require("./build") })
    : (req, res, next) => {
        purgeRequireCache()
        const build = require("./build")
        return createRequestHandler({ build, mode: MODE })(req, res, next)
      },
)

////////////////////////////////////////////////////////////////////////////////
function purgeRequireCache() {
  // purge require cache on requests for "server side HMR" this won't let
  // you have in-memory objects between requests in development,
  // alternatively you can set up nodemon/pm2-dev to restart the server on
  // file changes, we prefer the DX of this though, so we've included it
  // for you by default
  for (const key in require.cache) {
    if (key.startsWith(BUILD_DIR)) {
      console.log(key)
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
