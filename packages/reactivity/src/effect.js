import { isArray } from '@mpxjs/utils'
import { createDep } from './dep'

const targetMap = new WeakMap()
let activeEffect

class ReactiveEffect {
  constructor (fn) {
    this.deps = []
    this.fn = fn
  }

  run () {
    activeEffect = this
    const result = this.fn()
    activeEffect = undefined
    return result
  }
}

export function effect (fn) {
  const _effect = new ReactiveEffect(fn)
  _effect.run()
  return _effect
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
  if (activeEffect) {
    let depsMap = targetMap.get(target)
    if (!depsMap) {
      targetMap.set(target, depsMap = new Map())
    }
    let dep = depsMap.get(key)
    if (!dep) {
      depsMap.set(key, dep = createDep())
    }
    const eventInfo = __DEV__
      ? { effect: activeEffect, target, key }
      : undefined

    trackEffects(dep, eventInfo)
  }
}

export function trackEffects (dep) {
  dep.add(activeEffect)
  if (activeEffect) {
    activeEffect.deps.push(dep)
  }
}

/**
 * Finds all deps associated with the target (or a specific property) and
 * triggers the effects stored within.
 *
 * @param target - The reactive object.
 * @param key - Can be used to target a specific reactive property in the target object.
 */
export function trigger (target, key) {
  const depsMap = targetMap.get(target)
  if (!depsMap) {
    return
  }
  const deps = []
  deps.push(depsMap.get(key))

  if (deps.length === 1) {
    if( deps[0] ) {
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
  effect.run()
}
