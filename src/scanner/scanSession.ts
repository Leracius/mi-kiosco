// Each scan gets a new latch. A detector may report multiple frames before it stops.
export function createScanSession() {
  let closed = false

  return {
    get closed() { return closed },
    close() {
      if (closed) return false
      closed = true
      return true
    },
  }
}
