import type { BuildTarget } from "@remix-run/dev/build"
import { BuildMode } from "@remix-run/dev/build"
import type { AssetsManifest } from "@remix-run/dev/compiler/assets"
import { createAssetsManifest } from "@remix-run/dev/compiler/assets"
import { getAppDependencies } from "@remix-run/dev/compiler/dependencies"
import { loaders } from "@remix-run/dev/compiler/loaders"
import type { AssetsManifestPromiseRef } from "@remix-run/dev/compiler/plugins/serverAssetsManifestPlugin"
import { serverAssetsManifestPlugin } from "@remix-run/dev/compiler/plugins/serverAssetsManifestPlugin"
import { serverEntryModulePlugin } from "@remix-run/dev/compiler/plugins/serverEntryModulePlugin"
import { serverRouteModulesPlugin } from "@remix-run/dev/compiler/plugins/serverRouteModulesPlugin"
import { writeFileSafe } from "@remix-run/dev/compiler/utils/fs"
import { serverBuildVirtualModule } from "@remix-run/dev/compiler/virtualModules"
import type { RemixConfig } from "@remix-run/dev/config"
import * as esbuild from "esbuild"
import * as path from "node:path"

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
    // platform: "node",
    format: "cjs",
    treeShaking: true,
    // minify:
    //   options.mode === BuildMode.Production &&
    //   !!config.serverBuildTarget &&
    //   ["cloudflare-workers", "cloudflare-pages"].includes(
    //     config.serverBuildTarget,
    //   ),
    minify: options.mode === BuildMode.Production,
    mainFields: ["module", "main"],
    // mainFields:
    //   config.serverModuleFormat === "esm"
    //     ? ["module", "main"]
    //     : ["main", "module"],
    // target: "node16",
    // inject: config.serverBuildTarget === "deno" ? [] : [reactShim],
    loader: loaders,
    bundle: true,
    external: ["electron"],
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
