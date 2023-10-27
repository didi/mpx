import { extend, isArray, isIntegerKey } from '@mpxjs/utils'
import { createDep, newTracked, wasTracked, initDepMarkers, finalizeDepMarkers } from './dep'
import { TriggerOpTypes } from './operations'

const targetMap = new WeakMap()
export let activeEffect

export let shouldTrack = true
export const trackOpBit = 1

export class ReactiveEffect {
  constructor (fn, scheduler) {
    this.deps = []
    this.fn = fn
    this.parent = undefined
    this.active = true
    this.scheduler = scheduler
  }

  run () {
    try {
      if (!this.active) return this.fn()
      this.parent = activeEffect
      activeEffect = this
      shouldTrack = true
      // wasTracked
      initDepMarkers(this) // set w = 1
      return this.fn()
    } finally {
      finalizeDepMarkers(this)
      activeEffect = this.parent
      this.parent = undefined
    }
  }

  stop () {
    if (this.active) {
      cleanupEffect(this)
      if (this.onStop) {
        this.onStop()
      }
      this.active = false
    }
  }
}

function cleanupEffect (effect) {
  const { deps } = effect
  if (deps.length) {
    for (let i = 0; i < deps.length; i++) {
      deps[i].delete(effect)
    }
    deps.length = 0
  }
}

export const ITERATE_KEY = Symbol(__DEV__ ? 'iterate' : '')

export function effect (fn, options = {}) {
  if (fn.effect) {
    fn = fn.effect.fn
  }
  const _effect = new ReactiveEffect(fn)
  extend(_effect, options)
  if (!options.lazy) {
    _effect.run()
  }
  const runner = _effect.run.bind(_effect)
  runner.effect = _effect
  return runner
}

export function stop (runner) {
  runner && runner.effect && runner.effect.stop()
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

export function trackEffects (dep, debuggerEventExtraInfo) {
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
      if (__DEV__ && activeEffect.onTrack) {
        activeEffect.onTrack(debuggerEventExtraInfo)
      }
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
export function trigger (target, type, key, newValue) {
  const depsMap = targetMap.get(target)
  if (!depsMap) {
    return
  }

  const deps = []
  if (key === 'length' && isArray(target)) {
    const newLength = Number(newValue)
    depsMap.forEach((dep, key) => {
      if (key === 'length' || key >= newLength) {
        deps.push(dep)
      }
    })
  } else {
    deps.push(depsMap.get(key))
  }

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

  const eventInfo = __DEV__
    ? { target, type, key }
    : undefined

  if (deps.length === 1) {
    if (deps[0]) {
      if (__DEV__) {
        triggerEffects(deps[0], eventInfo)
      } else {
        triggerEffects(deps[0])
      }
    }
  } else {
    const effects = []
    for (const dep of deps) {
      if (dep) {
        effects.push(...dep)
      }
    }
    if (__DEV__) {
      triggerEffects(createDep(effects), eventInfo)
    } else {
      triggerEffects(createDep(effects))
    }
  }
}

export function triggerEffects (dep, debuggerEventExtraInfo) {
  const effects = isArray(dep) ? dep : [...dep]
  for (const effect of effects) {
    triggerEffect(effect, debuggerEventExtraInfo)
  }
}

function triggerEffect (effect, debuggerEventExtraInfo) {
  // 避免 effect 的入参函数出现无限循环
  // test(effect): should avoid implicit infinite recursive loops with itself
  if (effect !== activeEffect) {
    if (__DEV__ && effect.onTrigger) {
      effect.onTrigger(extend({ effect }, debuggerEventExtraInfo))
    }
    if (effect.scheduler) {
      effect.scheduler()
    } else {
      effect.run()
    }
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
