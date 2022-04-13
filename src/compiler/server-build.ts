import { loaders } from "@remix-run/dev/compiler/loaders.js"
import { emptyModulesPlugin } from "@remix-run/dev/compiler/plugins/emptyModulesPlugin.js"
import type { AssetsManifestPromiseRef } from "@remix-run/dev/compiler/plugins/serverAssetsManifestPlugin.js"
import { serverAssetsManifestPlugin } from "@remix-run/dev/compiler/plugins/serverAssetsManifestPlugin.js"
import { serverEntryModulePlugin } from "@remix-run/dev/compiler/plugins/serverEntryModulePlugin.js"
import { serverRouteModulesPlugin } from "@remix-run/dev/compiler/plugins/serverRouteModulesPlugin.js"
import { serverBuildVirtualModule } from "@remix-run/dev/compiler/virtualModules.js"
import type { RemixConfig } from "@remix-run/dev/config.js"
import type * as esbuild from "esbuild"
import { join } from "node:path"
import type { CompilerMode } from "../common/compiler-mode"
import { getNodeExternals } from "./externals"

export async function getServerBuildOptions(
  config: RemixConfig,
  mode: CompilerMode,
  assetsManifestPromiseRef: AssetsManifestPromiseRef,
): Promise<esbuild.BuildOptions> {
  return {
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
    external: await getNodeExternals(config.rootDirectory),
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
  }
}
