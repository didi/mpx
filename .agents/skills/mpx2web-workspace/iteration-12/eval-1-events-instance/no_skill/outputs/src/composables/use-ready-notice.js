export function useReadyNotice (recordReady) {
  return () => recordReady()
}
