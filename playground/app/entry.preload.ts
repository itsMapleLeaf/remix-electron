import { contextBridge, ipcRenderer } from "electron"

const electronApi = {
  ping: () => {
    ipcRenderer.send("ping")
  },
}

contextBridge.exposeInMainWorld("electronApi", electronApi)

declare global {
  // eslint-disable-next-line @typescript-eslint/consistent-type-definitions
  interface Window {
    electronApi: typeof electronApi
  }
}
