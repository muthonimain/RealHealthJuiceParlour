/** Avoid re-renders when polled API data is unchanged (reduces mobile layout jitter). */
export function dataUnchanged<T>(prev: T, next: T): boolean {
  try {
    return JSON.stringify(prev) === JSON.stringify(next)
  } catch {
    return false
  }
}
