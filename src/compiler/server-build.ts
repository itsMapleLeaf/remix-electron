import type { AssetsManifest } from "@remix-run/dev/compiler/assets.js"
import { createAssetsManifest } from "@remix-run/dev/compiler/assets.js"
import { getAppDependencies } from "@remix-run/dev/compiler/dependencies.js"
import { loaders } from "@remix-run/dev/compiler/loaders.js"
import { emptyModulesPlugin } from "@remix-run/dev/compiler/plugins/emptyModulesPlugin.js"
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
import type { CompilerMode } from "./mode"

export function createServerBuild(
  config: RemixConfig,
  mode: CompilerMode,
  assetsManifestPromiseRef: AssetsManifestPromiseRef,
): Promise<esbuild.BuildResult> {
  const dependencies = getAppDependencies(config)

  return esbuild.build({
    absWorkingDir: config.rootDirectory,
    stdin: {
      contents: `export * from ${JSON.stringify(serverBuildVirtualModule.id)};`,
      resolveDir: config.rootDirectory,
      loader: "ts",
    },
    outfile: config.serverBuildPath,
    platform: "node",
    target: "node16",
    format: "cjs",
    treeShaking: true,
    inject: [join(__dirname, "../shims/react-shim.ts")],
    minify: mode === "production",
    sourcemap: mode === "development" ? "external" : false,
    loader: loaders,
    bundle: true,
    external: [
      ...Object.keys(dependencies),
      ...builtinModules,
      "electron",
      "remix-electron",
    ],
    logLevel: "silent",

    // The server build needs to know how to generate asset URLs for imports
    // of CSS and other files.
    assetNames: "_assets/[name]-[hash]",
    publicPath: config.publicPath,
    define: {
      "process.env.NODE_ENV": JSON.stringify(mode),
      "process.env.REMIX_DEV_SERVER_WS_PORT": JSON.stringify(
        config.devServerPort,
      ),
    },
    plugins: [
      // mdxPlugin(config),
      emptyModulesPlugin(config, /\.client(\.[jt]sx?)?$/) as esbuild.Plugin,
      serverRouteModulesPlugin(config) as esbuild.Plugin,
      serverEntryModulePlugin(config) as esbuild.Plugin,
      serverAssetsManifestPlugin(assetsManifestPromiseRef) as esbuild.Plugin,

      // Including this plugin attempts to bundle electron, which we do not want :)
      // serverBareModulesPlugin(config, dependencies) as esbuild.Plugin,
    ],
  })
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
