/**
 * @type {import('@remix-run/dev').AppConfig}
 */
module.exports = {
  appDirectory: "app",
  assetsBuildDirectory: "public/build",
  publicPath: "/build/",
  serverBuildPath: "desktop/build/index.js",
  devServerPort: 8002,
  future: {
    unstable_dev: true,
  },
}
