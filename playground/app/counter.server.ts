import { setTimeout } from "node:timers/promises"

export async function* counter() {
  let count = 0
  while (true) {
    yield count
    await setTimeout(1000)
    count += 1
  }
}
