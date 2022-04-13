import { stat } from "node:fs/promises"

export const isFile = (file: string) =>
  stat(file)
    .then((stats) => stats.isFile())
    .catch(() => false)
