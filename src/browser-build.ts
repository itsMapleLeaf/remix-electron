import { getAppDependencies } from "@remix-run/dev/compiler/dependencies.js"
import { loaders } from "@remix-run/dev/compiler/loaders.js"
import { browserRouteModulesPlugin } from "@remix-run/dev/compiler/plugins/browserRouteModulesPlugin.js"
// import {} from "@remix-run/dev/compiler/plugins/emptyModulesPlugin.js"
// import { NodeModulesPolyfillPlugin } from "@esbuild-plugins/node-modules-polyfill"
import type { RemixConfig } from "@remix-run/dev/config"
import * as esbuild from "esbuild"
import { builtinModules as nodeBuiltins } from "node:module"
import * as path from "node:path"

export async function createBrowserBuild(
  config: RemixConfig,
  options: esbuild.BuildOptions & { incremental?: boolean },
): Promise<esbuild.BuildResult> {
  // For the browser build, exclude node built-ins that don't have a
  // browser-safe alternative installed in node_modules. Nothing should
  // *actually* be external in the browser build (we want to bundle all deps) so
  // this is really just making sure we don't accidentally have any dependencies
  // on node built-ins in browser bundles.
  const dependencies = Object.keys(await getAppDependencies(config))
  const externals = nodeBuiltins.filter((mod) => !dependencies.includes(mod))
  const fakeBuiltins = nodeBuiltins.filter((mod) => dependencies.includes(mod))

  if (fakeBuiltins.length > 0) {
    throw new Error(
      `It appears you're using a module that is built in to node, but you installed it as a dependency which could cause problems. Please remove ${fakeBuiltins.join(
        ", ",
      )} before continuing.`,
    )
  }

  const entryPoints: esbuild.BuildOptions["entryPoints"] = {
    "entry.client": path.resolve(config.appDirectory, config.entryClientFile),
  }
  for (const id of Object.keys(config.routes)) {
    // All route entry points are virtual modules that will be loaded by the
    // browserEntryPointsPlugin. This allows us to tree-shake server-only code
    // that we don't want to run in the browser (i.e. action & loader).
    entryPoints[id] =
      path.resolve(config.appDirectory, config.routes[id]!.file) + "?browser"
  }

  const plugins = [
    // mdxPlugin(config),
    browserRouteModulesPlugin(config, /\?browser$/) as esbuild.Plugin,
    // emptyModulesPlugin(config, /\.server(\.[jt]sx?)?$/),
    // NodeModulesPolyfillPlugin(),
  ]

  return esbuild.build({
    entryPoints,
    outdir: config.assetsBuildDirectory,
    platform: "browser",
    format: "esm",
    external: [...nodeBuiltins, "electron"],
    loader: loaders,
    bundle: true,
    logLevel: "info",
    // splitting: true,
    sourcemap: options.sourcemap,
    metafile: true,
    incremental: options.incremental,
    mainFields: ["browser", "module", "main"],
    treeShaking: true,
    minify: process.env.NODE_ENV === "production",
    entryNames: "[dir]/[name]-[hash]",
    chunkNames: "_shared/[name]-[hash]",
    assetNames: "_assets/[name]-[hash]",
    publicPath: config.publicPath,
    define: {
      "process.env.NODE_ENV": JSON.stringify(process.env.NODE_ENV),
      "process.env.REMIX_DEV_SERVER_WS_PORT": JSON.stringify(
        config.devServerPort,
      ),
    },
    plugins,
  })
}
