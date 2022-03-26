import type { DataFunctionArgs } from "@remix-run/server-runtime"

export type LoadContext = {
  secret: string
}

export type CustomDataFunctionArgs = Omit<DataFunctionArgs, "context"> & {
  context: LoadContext
}
