const refTargets = process.env.NODE_ENV !== 'production' ? new WeakMap() : null

export function registerRefDebugTarget (source, target, custom = false) {
  const info = refTargets.get(source) || {}
  info.target = target
  info.custom = custom
  refTargets.set(source, info)
  refTargets.set(target, info)
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
