#!/bin/env node
import cac from "cac"
import { oraPromise } from "ora"
import prettyMilliseconds from "pretty-ms"
import manifest from "../package.json"
import { build } from "./build"
import { develop } from "./develop"

const cli = cac(manifest.name)

cli.command("dev", "Develop your app with reloading on changes").action(develop)

cli.command("build", "Build your app for production").action(async () => {
  const startTime = Date.now()
  await oraPromise(build(), {
    text: "Building...",
    successText: () => {
      const totalTime = prettyMilliseconds(Date.now() - startTime)
      return `Built in ${totalTime}`
    },
    failText: "Build failed",
  })
})

cli.version(manifest.version)
cli.help()
cli.parse(process.argv, { run: false })

if (cli.matchedCommand) {
  await cli.runMatchedCommand()
} else {
  cli.outputHelp()
}
