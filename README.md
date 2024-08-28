# remix-electron

Electron integration for Remix

![demo screenshot](./screenshot.png)

## Setup

Use degit to create a new project from the template.

```sh
npx degit itsMapleLeaf/remix-electron/workspaces/template my-desktop-app
```

### Adding to an existing Remix project

Install remix-electron and electron:

```bash
npm i remix-electron electron
```

Add a file at `desktop/index.js` to run the electron app. The `initRemix` function returns a url to load in the browser window.

```ts
// desktop/index.js
const { initRemix } = require("remix-electron");
const { app, BrowserWindow } = require("electron");
const { join } = require("node:path");

/** @type {BrowserWindow | undefined} */
let win;

app.on("ready", async () => {
	try {
		const url = await initRemix({
			serverBuild: join(process.cwd(), "build/index.js"),
		});

		win = new BrowserWindow({ show: false });
		await win.loadURL(url);
		win.show();
	} catch (error) {
		console.error(error);
	}
});
```

Build the app with `npm run build`, then run `npx electron desktop/index.js` to start the app! 🚀

## Using Electron APIs

Importing `"electron"` directly in route files results in Electron trying to get bundled and called in the browser / renderer process.

To circumvent this, create a `electron.server.ts` file, which re-exports from electron. The `.server` suffix tells Remix to only load it in the main process. You should use `.server` for any code that runs in the main process and uses node/electron APIs.

```ts
// app/electron.server.ts
import electron from "electron";
export default electron;
```

```ts
// app/routes/_index.tsx
import electron from "~/electron.server";

export function loader() {
	return {
		userDataPath: electron.app.getPath("userData"),
	};
}
```

Likewise, for any code running in the renderer process, e.g. using the [clipboard](https://www.electronjs.org/docs/latest/api/clipboard) module, you can use the `.client` suffix. Renderer process modules require `nodeIntegration`.

```ts
// desktop/index.js
function createWindow() {
	// ...
	win = new BrowserWindow({
		// ...
		webPreferences: {
			nodeIntegration: true,
		},
	});
}
```

## API

### `async initRemix({ serverBuild[, publicFolder, mode, getLoadContext] })`

Initializes remix-electron. Returns a promise with a url to load in the browser window.

Options:

- `serverBuild`: The path to your server build (e.g. `path.join(process.cwd(), 'build')`), or the server build itself (e.g. required from `@remix-run/dev/server-build`). Updates on refresh are only supported when passing a path string.

- `mode`: The mode the app is running in. Can be `"development"` or `"production"`. Defaults to `"production"` when packaged, otherwise uses `process.env.NODE_ENV`.

- `publicFolder`: The folder where static assets are served from, including your browser build. Defaults to `"public"`. Non-absolute paths are resolved relative to `process.cwd()`.

- `getLoadContext`: Use this to inject some value into all of your remix loaders, e.g. an API client. The loaders receive it as `context`.

- `esm`: Set this to `true` to use remix-electron in an ESM application.

<details>
<summary>Load context TS example</summary>

**app/context.ts**

```ts
import type * as remix from "@remix-run/node";

// your context type
export type LoadContext = {
	secret: string;
};

// a custom data function args type to use for loaders/actions
export type DataFunctionArgs = Omit<remix.DataFunctionArgs, "context"> & {
	context: LoadContext;
};
```

**desktop/main.js**

```ts
const url = await initRemix({
	// ...

	/** @type {import("~/context").LoadContext} */
	getLoadContext: () => ({
		secret: "123",
	}),
});
```

In a route file:

```ts
import type { DataFunctionArgs, LoadContext } from "~/context";

export async function loader({ context }: DataFunctionArgs) {
	// do something with context
}
```

</details>

## Motivation

Electron has [a comprehensive list of security recommendations](https://www.electronjs.org/docs/latest/tutorial/security) to follow when building an app, especially if that app interacts with the web. Which includes, but is not limited to:

- Using `preload.js` files to expose specific electron functionality to your app, via globals
- Using IPC communication
- Avoiding `remote.require` (which has since been removed)

These practices can lead to a lot of awkward boilerplate and splitting up related code across multiple files and domains.

With `remix-electron`, you can freely use Electron APIs in Remix loader functions. It's a Node process with full Node capabilities, with access to the full Electron API, none of which runs in the browser.

The browser only receives data and renders a view. Additionally, you can neatly colocate your main process code right beside the related renderer code in a route file.

Thinking about it another way: it's like a normal Remix web app, except Electron is your backend.
