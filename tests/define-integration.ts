export function defineIntegration(block: () => void) {
  if (process.env.SKIP_INTEGRATION === "true") {
    console.info("Skipping integration tests")
  } else {
    block()
  }
}
