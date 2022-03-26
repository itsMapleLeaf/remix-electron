# remix-electron

Electron integration for Remix

v2 work in progress

## TODO

- cli
  - [x] dev
  - [x] build
  - [ ] cleaning
- [x] `initialRoute` option for RemixBrowserWindow
- [x] load context
- [x] `entry.electron.tsx`
- [ ] `entry.preload.tsx`
- [ ] project template/generator (?)
- config options
  - ???
- [ ] website (???)
- [ ] mdx support

## Motivation

Electron has [a comprehensive list of security recommendations](https://www.electronjs.org/docs/latest/tutorial/security) to follow when building an app, especially if that app interacts with the web. Which includes, but is not limited to:

- Using `preload.js` files to expose specific electron functionality to your app, via globals
- Using IPC communication
- Avoiding `remote.require` (which has since been removed)

These practices can lead to a lot of awkward boilerplate and splitting up related code across multiple files and domains.

With `remix-electron`, you can freely use Electron APIs in Remix loader functions. It's a Node process with full Node capabilities, with access to the full Electron API, none of which runs in the browser.

The browser only receives data and renders a view. Additionally, you can neatly colocate your main process code right beside the related renderer code in a route file.

Thinking about it another way: it's like a normal Remix web app, except Electron is your backend.
