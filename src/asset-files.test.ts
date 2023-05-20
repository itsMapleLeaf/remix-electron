import { join } from "node:path"
import { expect, test } from "vitest"
import { collectAssetFiles } from "./asset-files"

test("collectAssetFiles", async () => {
  expect(
    await collectAssetFiles(join(__dirname, "../tests/fixtures/asset-files")),
  ).toMatchInlineSnapshot(`
    [
      {
        "content": [Function],
        "path": "/a.txt",
        "stream": [Function],
      },
      {
        "content": [Function],
        "path": "/b.txt",
        "stream": [Function],
      },
      {
        "content": [Function],
        "path": "/c/nested.txt",
        "stream": [Function],
      },
    ]
  `)
})
