const refTargets = process.env.NODE_ENV !== 'production' ? new WeakMap() : null

export function registerRefDebugTarget (source, target, custom = false) {
  refTargets.set(source, { target, custom })
  refTargets.set(target, source)
}

export function getRefDebugTarget (ref) {
  return refTargets.get(ref)
}

export function createDebuggerInfo (target, type, key, values) {
  const ref = refTargets.get(target)
  const info = {
    target: ref ? ref.target : target,
    type,
    key: ref ? 'value' : key
  }
  if (values && !(ref && ref.custom)) Object.assign(info, values)
  return info
}
