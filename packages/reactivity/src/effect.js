import { isArray, isIntegerKey } from '@mpxjs/utils'
import { createDep, newTracked, wasTracked, initDepMarkers, finalizeDepMarkers } from './dep'
import { TriggerOpTypes } from './operations'

const targetMap = new WeakMap()
let activeEffect

export let shouldTrack = true
export const trackOpBit = 1

class ReactiveEffect {
  constructor (fn) {
    this.deps = []
    this.fn = fn
  }

  run () {
    let result
    try {
      activeEffect = this
      shouldTrack = true
      // wasTracked
      initDepMarkers(this) // set w = 1
      result = this.fn()
    } finally {
      finalizeDepMarkers(this)
      activeEffect = undefined
      return result
    }
  }
}

export const ITERATE_KEY = Symbol(__DEV__ ? 'iterate' : '')

export function effect (fn) {
  if (fn.effect) {
    fn = fn.effect.fn
  }
  const _effect = new ReactiveEffect(fn)
  _effect.run()
  const runner = _effect.run.bind(_effect)
  runner.effect = _effect
  return runner
}

/**
 * Tracks access to a reactive property.
 *
 * This will check which effect is running at the moment and record it as dep
 * which records all effects that depend on the reactive property.
 *
 * @param target - Object holding the reactive property.
 * @param key - Identifier of the reactive property to track.
 */
export function track (target, key) {
  if (shouldTrack && activeEffect) {
    let depsMap = targetMap.get(target)
    if (!depsMap) {
      targetMap.set(target, (depsMap = new Map()))
    }
    let dep = depsMap.get(key)
    if (!dep) {
      depsMap.set(key, (dep = createDep()))
    }
    const eventInfo = __DEV__
      ? { effect: activeEffect, target, key }
      : undefined

    trackEffects(dep, eventInfo)
  }
}

export function trackEffects (dep) {
  let shouldTrack = false
  // n: 1
  if (!newTracked(dep)) {
    dep.n |= trackOpBit // set newly tracked, n = 1
    shouldTrack = !wasTracked(dep)
  } else {
    shouldTrack = !dep.has(activeEffect)
  }

  if (shouldTrack) {
    dep.add(activeEffect)
    if (activeEffect) {
      activeEffect.deps.push(dep)
    }
  }
}

/**
 * Finds all deps associated with the target (or a specific property) and
 * triggers the effects stored within.
 *
 * @param target - The reactive object.
 * @param type - Defines the type of the operation that needs to trigger effects.
 * @param key - Can be used to target a specific reactive property in the target object.
 */
export function trigger (target, type, key) {
  const depsMap = targetMap.get(target)
  if (!depsMap) {
    return
  }
  const deps = []
  deps.push(depsMap.get(key))

  switch (type) {
    case TriggerOpTypes.ADD:
      if (!isArray(target)) {
        deps.push(depsMap.get(ITERATE_KEY))
      } else if (isIntegerKey(key)) {
        // new index added to array -> length changes
        deps.push(depsMap.get('length'))
      }
      break
    case TriggerOpTypes.SET:
      break
  }

  if (deps.length === 1) {
    if (deps[0]) {
      triggerEffects(deps[0])
    }
  } else {
    const effects = []
    for (const dep of deps) {
      if (dep) {
        effects.push(...dep)
      }
    }
    triggerEffects(createDep(effects))
  }
}

function triggerEffects (dep) {
  const effects = isArray(dep) ? dep : [...dep]
  for (const effect of effects) {
    triggerEffect(effect)
  }
}

function triggerEffect (effect) {
  // 避免 effect 的入参函数出现无限循环
  // test(effect): should avoid implicit infinite recursive loops with itself
  if (effect !== activeEffect) {
    effect.run()
  }
}

/**
 * pauses tracking.
 */
export function pauseTracking () {
  shouldTrack = false
}

/**
 * Re-enables effect tracking (if it was paused).
 */
export function enableTracking () {
  shouldTrack = true
}
