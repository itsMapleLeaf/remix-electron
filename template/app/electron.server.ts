import electron from "electron"

console.log(electron)

export function getAppDataPath() {
  return electron.app.getPath("appData")
}
