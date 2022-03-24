export type CompilerMode = "development" | "production"

export function maybeCompilerMode(mode: unknown): CompilerMode | undefined {
  return mode === "development" || mode === "production" ? mode : undefined
}
