import type { AssetsManifest } from "@remix-run/dev/compiler/assets.js"
import { createAssetsManifest } from "@remix-run/dev/compiler/assets.js"
import { writeFileSafe } from "@remix-run/dev/compiler/utils/fs.js"
import type { RemixConfig } from "@remix-run/dev/config.js"
import type * as esbuild from "esbuild"
import * as path from "node:path"

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
