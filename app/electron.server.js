// @ts-nocheck
// attempting `export * from "electron"` in a TS file results in an error
// due to TS module weirdness
// so instead, we have this untyped js file w/ a typed .d.ts file
export * from "electron"
