import type { BuildTarget } from "@remix-run/dev/build.js"
import { BuildMode } from "@remix-run/dev/build.js"
import type { AssetsManifest } from "@remix-run/dev/compiler/assets.js"
import { createAssetsManifest } from "@remix-run/dev/compiler/assets.js"
import { getAppDependencies } from "@remix-run/dev/compiler/dependencies.js"
import { loaders } from "@remix-run/dev/compiler/loaders.js"
import type { AssetsManifestPromiseRef } from "@remix-run/dev/compiler/plugins/serverAssetsManifestPlugin.js"
import { serverAssetsManifestPlugin } from "@remix-run/dev/compiler/plugins/serverAssetsManifestPlugin.js"
import { serverEntryModulePlugin } from "@remix-run/dev/compiler/plugins/serverEntryModulePlugin.js"
import { serverRouteModulesPlugin } from "@remix-run/dev/compiler/plugins/serverRouteModulesPlugin.js"
import { writeFileSafe } from "@remix-run/dev/compiler/utils/fs.js"
import { serverBuildVirtualModule } from "@remix-run/dev/compiler/virtualModules.js"
import type { RemixConfig } from "@remix-run/dev/config.js"
import * as esbuild from "esbuild"
import { builtinModules } from "node:module"
import * as path from "node:path"
import { join } from "node:path"

type BuildConfig = {
  mode: BuildMode
  target: BuildTarget
  sourcemap: boolean
}

type BuildOptions = {
  onWarning?(message: string, key: string): void
  onBuildFailure?(failure: Error | esbuild.BuildFailure): void
} & Partial<BuildConfig>

export async function createServerBuild(
  config: RemixConfig,
  options: BuildOptions & { incremental?: boolean },
  assetsManifestPromiseRef: AssetsManifestPromiseRef,
): Promise<esbuild.BuildResult> {
  const dependencies = await getAppDependencies(config)

  // let stdin: esbuild.StdinOptions | undefined
  // let entryPoints: string[] | undefined

  // if (config.serverEntryPoint) {
  //   entryPoints = [config.serverEntryPoint]
  // } else {
  //   stdin = {
  //     contents: config.serverBuildTargetEntryModule,
  //     resolveDir: config.rootDirectory,
  //     loader: "ts",
  //   }
  // }

  // const plugins = [
  //   mdxPlugin(config),
  //   emptyModulesPlugin(config, /\.client(\.[jt]sx?)?$/),
  //   serverRouteModulesPlugin(config),
  //   serverEntryModulePlugin(config),
  //   serverBareModulesPlugin(config, dependencies),
  //   serverAssetsManifestPlugin(assetsManifestPromiseRef),
  // ]

  return esbuild.build({
    absWorkingDir: config.rootDirectory,
    // entryPoints: [config.serverEntryPoint!],
    stdin: {
      contents: `export * from ${JSON.stringify(serverBuildVirtualModule.id)};`,
      resolveDir: config.rootDirectory,
      loader: "ts",
    },
    outfile: config.serverBuildPath,
    // write: false,
    platform: "node",
    target: "node16",
    format: "cjs",
    treeShaking: true,
    inject: [join(__dirname, "../shims/react-shim.ts")],
    // minify:
    //   options.mode === BuildMode.Production &&
    //   !!config.serverBuildTarget &&
    //   ["cloudflare-workers", "cloudflare-pages"].includes(
    //     config.serverBuildTarget,
    //   ),
    minify: options.mode === BuildMode.Production,
    // mainFields: ["main", "module"],
    // mainFields:
    //   config.serverModuleFormat === "esm"
    //     ? ["module", "main"]
    //     : ["main", "module"],
    // inject: config.serverBuildTarget === "deno" ? [] : [reactShim],
    loader: loaders,
    bundle: true,
    external: [
      ...Object.keys(dependencies),
      ...builtinModules,
      "electron",
      "remix-electron",
    ],
    logLevel: "info",
    // incremental: options.incremental,
    // sourcemap: options.sourcemap ? "inline" : false,
    sourcemap: "external",
    // The server build needs to know how to generate asset URLs for imports
    // of CSS and other files.
    assetNames: "_assets/[name]-[hash]",
    publicPath: config.publicPath,
    define: {
      "process.env.NODE_ENV": JSON.stringify(options.mode),
      "process.env.REMIX_DEV_SERVER_WS_PORT": JSON.stringify(
        config.devServerPort,
      ),
    },
    plugins: [
      // mdxPlugin(config),
      // emptyModulesPlugin(config, /\.client(\.[jt]sx?)?$/),
      serverRouteModulesPlugin(config) as esbuild.Plugin,
      serverEntryModulePlugin(config) as esbuild.Plugin,
      // serverBareModulesPlugin(config, dependencies) as esbuild.Plugin,
      serverAssetsManifestPlugin(assetsManifestPromiseRef) as esbuild.Plugin,
    ],
  })
  // .then(async (build) => {
  //   // await writeServerBuildResult(config, build.outputFiles)
  //   console.log(build.outputFiles)
  //   return build
  // })
}

export async function generateAssetsManifest(
  config: RemixConfig,
  metafile: esbuild.Metafile,
): Promise<AssetsManifest> {
  const assetsManifest = await createAssetsManifest(config, metafile)
  const filename = `manifest-${assetsManifest.version.toUpperCase()}.js`

  assetsManifest.url = config.publicPath + filename

  await writeFileSafe(
    path.join(config.assetsBuildDirectory, filename),
    `window.__remixManifest=${JSON.stringify(assetsManifest)};`,
  )

  return assetsManifest
}
