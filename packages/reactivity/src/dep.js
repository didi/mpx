export function createDep (effects = []) {
  const dep = new Set(effects)
  return dep
}
