/**
 * @type {import('@remix-run/dev/config').AppConfig}
 */
module.exports = {
  appDirectory: "app",
  assetsBuildDirectory: "public/build",
  publicPath: "/build/",
  server: "desktop/main.ts",
  serverBuildPath: "desktop/build/index.js",
  devServerPort: 8002,
  ignoredRouteFiles: [".*"],
}
