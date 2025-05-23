import { expect, test, vi } from 'vitest'
import {
  EffectScope,
  effect,
  effectScope,
  getCurrentScope,
  onScopeDispose,
  reactive
} from '../src'

test('should run', () => {
  const spy = vi.fn(() => {
    /** noop */
  })
  effectScope().run(spy)
  expect(spy).toHaveBeenCalledTimes(1)
})

test('should accept zero argument', () => {
  const scope = effectScope()
  expect(scope.effects.length).toBe(0)
})

test('should return run value', () => {
  expect(effectScope().run(() => 1)).toBe(1)
})

test('should collect the effects', () => {
  const scope = effectScope()
  scope.run(() => {
    let dummy
    const counter = reactive({ num: 0 })
    effect(() => (dummy = counter.num))

    expect(dummy).toBe(0)
    counter.num = 7
    expect(dummy).toBe(7)
  })

  expect(scope.effects.length).toBe(1)
})

test('stop', () => {
  let dummy, doubled
  const counter = reactive({ num: 0 })

  const scope = effectScope()
  scope.run(() => {
    effect(() => (dummy = counter.num))
    effect(() => (doubled = counter.num * 2))
  })

  expect(scope.effects.length).toBe(2)

  expect(dummy).toBe(0)
  expect(doubled).toBe(0)
  counter.num = 7
  expect(dummy).toBe(7)
  expect(doubled).toBe(14)

  scope.stop()

  counter.num = 6
  expect(dummy).toBe(7)
  expect(doubled).toBe(14)
})

test('should collect nested scope', () => {
  let dummy, doubled
  const counter = reactive({ num: 0 })

  const scope = effectScope()
  scope.run(() => {
    effect(() => (dummy = counter.num))
    // nested scope
    effectScope().run(() => {
      effect(() => (doubled = counter.num * 2))
    })
  })

  expect(scope.effects.length).toBe(1)
  expect(scope.scopes!.length).toBe(1)
  expect(scope.scopes![0]).toBeInstanceOf(EffectScope)

  expect(dummy).toBe(0)
  counter.num = 7
  expect(dummy).toBe(7)
  expect(doubled).toBe(14)

  // stop the nested scope as well
  scope.stop()

  counter.num = 6
  expect(dummy).toBe(7)
  expect(doubled).toBe(14)
})

test('nested scope can be escaped', () => {
  let dummy, doubled
  const counter = reactive({ num: 0 })

  const scope = effectScope()
  scope.run(() => {
    effect(() => (dummy = counter.num))
    // nested scope, but detached
    effectScope(true).run(() => {
      effect(() => (doubled = counter.num * 2))
    })
  })

  expect(scope.effects.length).toBe(1)
  expect(scope.scopes).toBeUndefined()

  expect(dummy).toBe(0)
  counter.num = 7
  expect(dummy).toBe(7)
  expect(doubled).toBe(14)

  scope.stop()

  counter.num = 6
  expect(dummy).toBe(7)

  // nested scope should not be stopped since it's detached
  expect(doubled).toBe(12)
})

test('able to run the scope', () => {
  let dummy, doubled
  const counter = reactive({ num: 0 })

  const scope = effectScope()
  scope.run(() => {
    effect(() => (dummy = counter.num))
  })

  expect(scope.effects.length).toBe(1)

  scope.run(() => {
    effect(() => (doubled = counter.num * 2))
  })

  expect(scope.effects.length).toBe(2)

  counter.num = 7
  expect(dummy).toBe(7)
  expect(doubled).toBe(14)

  scope.stop()
})

test('can not run an inactive scope', () => {
  let dummy, doubled
  const counter = reactive({ num: 0 })

  const scope = effectScope()
  scope.run(() => {
    effect(() => (dummy = counter.num))
  })

  expect(scope.effects.length).toBe(1)

  scope.stop()

  scope.run(() => {
    effect(() => (doubled = counter.num * 2))
  })

  expect(scope.effects.length).toBe(0)

  counter.num = 7
  expect(dummy).toBe(0)
  expect(doubled).toBeUndefined()
})

test('should fire onScopeDispose hook', () => {
  let dummy = 0

  const scope = effectScope()
  scope.run(() => {
    onScopeDispose(() => (dummy += 1))
    onScopeDispose(() => (dummy += 2))
  })

  scope.run(() => {
    onScopeDispose(() => (dummy += 4))
  })

  expect(dummy).toBe(0)

  scope.stop()
  expect(dummy).toBe(7)
})

test('should dereference child scope from parent scope after stopping child scope (no memleaks)', () => {
  const parent = effectScope()
  const child = parent.run(() => effectScope())!
  expect(parent.scopes!.includes(child)).toBe(true)
  child.stop()
  expect(parent.scopes!.includes(child)).toBe(false)
})

test('getCurrentScope() stays valid when running a detached nested EffectScope', () => {
  const parentScope = effectScope()

  parentScope.run(() => {
    const currentScope = getCurrentScope()
    expect(currentScope).toBeDefined()
    const detachedScope = effectScope(true)
    detachedScope.run(() => {
      /** noop */
    })

    expect(getCurrentScope()).toBe(currentScope)
  })
})

/**
 * 🚀 fix mpx legacy
 */
test('calling .off() of a detached scope inside an active scope should not break currentScope', () => {
  const parentScope = effectScope()

  parentScope.run(() => {
    const childScope = effectScope(true)
    childScope.on()
    childScope.off()
    expect(getCurrentScope()).toBe(parentScope)
  })
})
