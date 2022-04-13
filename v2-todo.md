# todo

- cli
  - [x] dev
  - [x] build
  - [ ] cleaning build folders before starting
- [x] `initialRoute` option for RemixBrowserWindow
- [x] load context
- [x] `entry.electron.ts`
- [x] `entry.preload.ts`
- [x] project template
- config options
  - [ ] serverDependenciesToBundle
  - [ ] clean (?) (cleans build folders before dev/build)
- [ ] mdx support
- [ ] remix stack w/ tailwind, testing, etc
- [ ] split into multiple packages?
  - motivation: make it easier to enforce the dev/prod dependencies of each export

# bugs

- [ ] config paths need to be absolute, since we can't always rely on cwd being the project root
- [x] runtime APIs currently rely on compiler APIs (config), which requires @remix-run/dev to be a prod dependency

## website

- [x] basic project setup
- [ ] structure / styling
- [ ] landing page with code sample
- [ ] API reference generated w/ typedoc

### topics

- [ ] motivation: explain why this dumpster fire of a project exists
- [ ] getting started: creating a new project from template
- [ ] getting started: adding to existing remix project
- [ ] project structure

  - [ ] `entry.electron.ts` -- for creating electron window, tray, etc.
  - [ ] `entry.preload.ts` -- for [preload](https://www.electronjs.org/docs/latest/tutorial/process-model#preload-scripts) stuff

    - this file is optional
    - example: realtime messaging between main/renderer via IPC, _if_ needed
    - code example for a typesafe preload:

      ```ts
      import { contextBridge, ipcRenderer } from "electron"

      const electronApi = {
        ping: () => {
          ipcRenderer.send("ping")
        },
      }

      contextBridge.exposeInMainWorld("electronApi", electronApi)

      declare global {
        interface Window {
          electronApi: typeof electronApi
        }
      }
      ```

- [ ] form actions
  - they work the same as in web Remix, but you can use electron APIs to do stuff like open new windows, etc.
  - include some examples when i think of them
- [ ] guide: load context
- [ ] guide: persistence via electron-store
  - a lot of people are used to using cookies with Remix to do this, but cookies broke (for now?)
- [ ] guide: creating a new window via an action
  - example: settings menu, make a route at /settings and open a new window there via `getRouteUrl('/settings')`
- [ ] guide: testing???
