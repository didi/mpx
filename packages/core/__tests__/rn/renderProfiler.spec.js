/** @file RN render profiler helper tests */

import {
  appendRenderCause,
  commitRenderCauseSnapshot,
  consumeRenderCauseSnapshot,
  createRenderCauseState,
  createRenderProfilerId,
  createRenderProfilerMeta,
  getChangedPropKeys,
  getUpdateToCommitDuration,
  MAX_PENDING_RENDER_CAUSES,
  MAX_RENDER_CAUSES,
  normalizeRenderCause,
  registerSetupRenderProfilerRefs,
  snapshotRenderCauses,
  resolveRenderProfiler
} from '../../src/platform/patch/renderProfiler'
import { ReactiveEffect } from '../../src/observer/effect'
import { computed } from '../../src/observer/computed'
import { reactive } from '../../src/observer/reactive'
import { customRef, getCurrentTriggerRef, ref, shallowRef, toRef, triggerRef } from '../../src/observer/ref'
import MpxProxy from '../../src/core/proxy'

jest.mock('../../src/index', () => ({
  __esModule: true,
  default: {
    config: {
      forceFlushSync: false,
      ignoreProxyWhiteList: []
    }
  }
}))

describe('RN render profiler', () => {
  it('creates stable component metadata from compiler injections', () => {
    expect(createRenderProfilerMeta('component', {
      mpxFileResource: '/workspace/src/components/card.mpx'
    }, {
      moduleId: 'card-module',
      componentPath: '/components/card/index'
    })).toEqual({
      type: 'component',
      moduleId: 'card-module',
      componentPath: '/components/card/index',
      resource: '/workspace/src/components/card.mpx'
    })
  })

  it('compares props against the last committed snapshot', () => {
    expect(getChangedPropKeys(null, { value: 1 })).toEqual(['<mount>'])
    expect(getChangedPropKeys({
      stable: Number.NaN,
      changed: 1,
      removed: true
    }, {
      stable: Number.NaN,
      changed: 2,
      added: true
    })).toEqual(['changed', 'removed', 'added'])
  })

  it('only enables valid matching profiler configs', () => {
    const meta = createRenderProfilerMeta('page', {}, {
      moduleId: 'page-module',
      componentPath: '/pages/index'
    })
    const onRender = jest.fn()

    expect(resolveRenderProfiler({ enabled: false, onRender }, meta)).toBeNull()
    expect(resolveRenderProfiler({
      enabled: true,
      onRender,
      shouldProfile: () => false
    }, meta)).toBeNull()
    expect(resolveRenderProfiler({ enabled: true, onRender }, meta)).toEqual({
      config: { enabled: true, onRender },
      meta
    })
  })

  it('isolates filter errors and creates unique profiler ids', () => {
    const meta = createRenderProfilerMeta('component', {}, {
      moduleId: 'card-module',
      componentPath: '/components/card/index'
    })
    const onFilterError = jest.fn()
    const error = new Error('filter failed')

    expect(resolveRenderProfiler({
      enabled: true,
      onRender: jest.fn(),
      shouldProfile: () => {
        throw error
      }
    }, meta, onFilterError)).toBeNull()
    expect(onFilterError).toHaveBeenCalledWith(error)
    expect(createRenderProfilerId(meta)).not.toBe(createRenderProfilerId(meta))
  })

  it('uses the framework clock for update-to-commit duration', () => {
    expect(getUpdateToCommitDuration(null, () => 125)).toBeNull()
    expect(getUpdateToCommitDuration(100, () => 125)).toBe(25)
    expect(getUpdateToCommitDuration(150, () => 125)).toBe(0)
  })

  it('normalizes trigger info without retaining values, targets or stacks', () => {
    expect(normalizeRenderCause({
      type: 'set',
      key: 'visible',
      target: { visible: true },
      oldValue: false,
      newValue: true,
      stack: 'sensitive stack'
    })).toEqual({
      kind: 'reactive',
      source: 'unknown',
      operation: 'set',
      key: 'visible',
      count: 1
    })
    expect(normalizeRenderCause({
      type: 'array-mutation',
      method: 'splice'
    })).toEqual({
      kind: 'reactive',
      source: 'unknown',
      operation: 'array-mutation',
      method: 'splice',
      count: 1
    })
    expect(normalizeRenderCause({
      type: 'set',
      key: '__composition_api_ref_key__'
    })).toEqual({
      kind: 'reactive',
      source: 'unknown',
      operation: 'trigger-ref',
      count: 1
    })
    expect(normalizeRenderCause({ kind: 'force-update' })).toEqual({
      kind: 'force-update',
      count: 1
    })
  })

  it('resolves setup ref aliases for ref, shallowRef, customRef and triggerRef without retaining identity', () => {
    const state = createRenderCauseState()
    const visible = ref(false)
    const selection = shallowRef({ id: 1 })
    let customValue = 0
    const custom = customRef((track, trigger) => ({
      get: () => {
        track()
        return customValue
      },
      set: (value) => {
        customValue = value
        trigger()
      }
    }))
    registerSetupRenderProfilerRefs(state, {
      visibleAlias: visible,
      visible,
      selection,
      custom
    })

    const effect = new ReactiveEffect(() => [visible.value, selection.value, custom.value], jest.fn())
    effect.onTrigger = info => appendRenderCause(state, info, 10)
    effect.run()

    visible.value = true
    selection.value = { id: 2 }
    triggerRef(selection)
    custom.value = 1

    expect(snapshotRenderCauses(state, false).causes).toEqual([{
      kind: 'reactive',
      source: 'setup',
      operation: 'trigger-ref',
      key: 'visible/visibleAlias',
      count: 1
    }, {
      kind: 'reactive',
      source: 'setup',
      operation: 'trigger-ref',
      key: 'selection',
      count: 2
    }, {
      kind: 'reactive',
      source: 'setup',
      operation: 'trigger-ref',
      key: 'custom',
      count: 1
    }])
    state.pendingCauses.forEach((entry) => {
      expect(entry.cause).not.toHaveProperty('ref')
      expect(entry.cause).not.toHaveProperty('target')
      expect(entry.cause).not.toHaveProperty('value')
    })
  })

  it('registers Options API computed fields as render cause aliases', () => {
    const state = createRenderCauseState()
    const hiddenStoreValue = ref(0)
    let computedObj
    global.mpxGlobal = {
      __mpx: {
        isReactive: () => false,
        isRef: () => false
      }
    }
    const proxy = Object.create(MpxProxy.prototype)
    Object.assign(proxy, {
      options: {
        computed: {
          marketInfo () {
            return hiddenStoreValue.value
          }
        },
        mpxFileResource: '/workspace/src/components/market.mpx'
      },
      target: {},
      collectLocalKeys: jest.fn(),
      createProxyConflictHandler: jest.fn(),
      registerSetupRenderProfilerRefs: (value) => {
        computedObj = value
        registerSetupRenderProfilerRefs(state, value)
      }
    })

    proxy.initComputed()
    const effect = new ReactiveEffect(() => computedObj.marketInfo.value, jest.fn())
    effect.enableComputedTriggerTracking()
    effect.onTrigger = (info, computedTriggerRefs, refTriggerRefs) => {
      appendRenderCause(state, info, 1, computedTriggerRefs, refTriggerRefs)
    }
    effect.run()

    hiddenStoreValue.value = 1

    expect(snapshotRenderCauses(state, false).causes).toEqual([{
      kind: 'reactive',
      source: 'setup',
      operation: 'trigger-ref',
      key: 'marketInfo',
      count: 1
    }])
  })

  it('keeps setup ref aliases isolated per component profiler state', () => {
    const shared = ref(0)
    const firstState = createRenderCauseState()
    const secondState = createRenderCauseState()
    registerSetupRenderProfilerRefs(firstState, { firstAlias: shared })
    registerSetupRenderProfilerRefs(secondState, {
      zAlias: shared,
      aAlias: shared
    })

    const firstEffect = new ReactiveEffect(() => shared.value, jest.fn())
    firstEffect.onTrigger = info => appendRenderCause(firstState, info, 1)
    firstEffect.run()
    const secondEffect = new ReactiveEffect(() => shared.value, jest.fn())
    secondEffect.onTrigger = info => appendRenderCause(secondState, info, 1)
    secondEffect.run()

    shared.value++

    expect(snapshotRenderCauses(firstState, false).causes[0].key).toBe('firstAlias')
    expect(snapshotRenderCauses(secondState, false).causes[0].key).toBe('aAlias/zAlias')
  })

  it('keeps custom ref identity when its trigger runs after the setter returns', () => {
    const state = createRenderCauseState()
    let value = 0
    let deferredTrigger
    const deferred = customRef((track, trigger) => ({
      get: () => {
        track()
        return value
      },
      set: (nextValue) => {
        value = nextValue
        deferredTrigger = trigger
      }
    }))
    registerSetupRenderProfilerRefs(state, { deferred })
    const effect = new ReactiveEffect(() => deferred.value, jest.fn())
    effect.enableComputedTriggerTracking()
    effect.onTrigger = (info, computedRefs, refRefs) => appendRenderCause(state, info, 1, computedRefs, refRefs)
    effect.run()

    deferred.value = 1
    expect(state.pendingCauses).toEqual([])
    deferredTrigger()

    expect(snapshotRenderCauses(state, false).causes).toEqual([{
      kind: 'reactive',
      source: 'setup',
      operation: 'trigger-ref',
      key: 'deferred',
      count: 1
    }])
  })

  it('does not add reactive dependencies for a custom ref that only returns a raw value', () => {
    const raw = reactive([])
    let customTrigger
    const custom = customRef((track, trigger) => {
      customTrigger = trigger
      return {
        get: () => {
          track()
          return raw
        },
        set: jest.fn()
      }
    })
    const scheduler = jest.fn()
    const effect = new ReactiveEffect(() => custom.value, scheduler)
    effect.enableComputedTriggerTracking()
    effect.onTrigger = jest.fn()
    effect.run()

    raw.push('item')
    expect(scheduler).not.toHaveBeenCalled()
    customTrigger()
    expect(scheduler).toHaveBeenCalledTimes(1)
  })

  it('restores transient ref identity when a profiled setter throws', () => {
    const state = createRenderCauseState()
    const broken = customRef(() => ({
      get: () => 0,
      set: () => {
        throw new Error('write failed')
      }
    }))
    registerSetupRenderProfilerRefs(state, { broken })

    expect(() => {
      broken.value = 1
    }).toThrow('write failed')
    expect(getCurrentTriggerRef()).toBeUndefined()
  })

  it('resolves setup aliases for toRef and writable computed setters', () => {
    const state = createRenderCauseState()
    const source = reactive({ linked: 0, computedBase: 0 })
    const linked = toRef(source, 'linked')
    const writable = computed({
      get: () => source.computedBase,
      set: value => {
        source.computedBase = value
      }
    })
    registerSetupRenderProfilerRefs(state, { linked, writable })
    const effect = new ReactiveEffect(() => [linked.value, writable.value], jest.fn())
    effect.onTrigger = info => appendRenderCause(state, info, 1)
    effect.run()

    linked.value = 1
    writable.value = 2

    expect(snapshotRenderCauses(state, false).causes).toEqual([{
      kind: 'reactive',
      source: 'setup',
      operation: 'trigger-ref',
      key: 'linked',
      count: 1
    }, {
      kind: 'reactive',
      source: 'setup',
      operation: 'trigger-ref',
      key: 'writable',
      count: 1
    }])
  })

  it('attributes deep object and array mutations to their returned setup refs', () => {
    const state = createRenderCauseState()
    const form = ref({ count: 0 })
    const list = ref([])
    registerSetupRenderProfilerRefs(state, { form, list })
    const effect = new ReactiveEffect(() => [form.value.count, list.value.length], jest.fn())
    effect.enableComputedTriggerTracking()
    effect.onTrigger = (info, computedRefs, refRefs) => appendRenderCause(state, info, 1, computedRefs, refRefs)
    effect.run()

    form.value.count++
    list.value.push('item')

    expect(snapshotRenderCauses(state, false).causes).toEqual([{
      kind: 'reactive',
      source: 'setup',
      operation: 'set',
      key: 'form.count',
      count: 1
    }, {
      kind: 'reactive',
      source: 'setup',
      operation: 'array-mutation',
      key: 'list',
      method: 'push',
      count: 1
    }])
    state.pendingCauses.forEach((entry) => {
      expect(entry.cause).not.toHaveProperty('ref')
      expect(entry.cause).not.toHaveProperty('refs')
    })
  })

  it('keeps deep ref aliases isolated when reactive values are shared', () => {
    const sharedValue = reactive({ count: 0 })
    const first = ref(sharedValue)
    const second = ref(sharedValue)
    const firstState = createRenderCauseState()
    const secondState = createRenderCauseState()
    registerSetupRenderProfilerRefs(firstState, { first })
    registerSetupRenderProfilerRefs(secondState, { second })
    const firstEffect = new ReactiveEffect(() => first.value.count, jest.fn())
    firstEffect.enableComputedTriggerTracking()
    firstEffect.onTrigger = (info, computedRefs, refRefs) => appendRenderCause(firstState, info, 1, computedRefs, refRefs)
    firstEffect.run()
    const secondEffect = new ReactiveEffect(() => second.value.count, jest.fn())
    secondEffect.enableComputedTriggerTracking()
    secondEffect.onTrigger = (info, computedRefs, refRefs) => appendRenderCause(secondState, info, 1, computedRefs, refRefs)
    secondEffect.run()

    sharedValue.count++

    expect(snapshotRenderCauses(firstState, false).causes[0].key).toBe('first.count')
    expect(snapshotRenderCauses(secondState, false).causes[0].key).toBe('second.count')
  })

  it('recollects deep ref dependencies after replacing the reactive value', () => {
    const state = createRenderCauseState()
    const previous = reactive({ count: 0 })
    const current = reactive({ count: 0 })
    const form = ref(previous)
    registerSetupRenderProfilerRefs(state, { form })
    const effect = new ReactiveEffect(() => form.value.count, jest.fn())
    effect.enableComputedTriggerTracking()
    effect.onTrigger = (info, computedRefs, refRefs) => appendRenderCause(state, info, 1, computedRefs, refRefs)
    effect.run()

    form.value = current
    effect.run()
    commitRenderCauseSnapshot(state, snapshotRenderCauses(state, false), true)
    previous.count++
    expect(state.pendingCauses).toEqual([])

    current.count++
    expect(snapshotRenderCauses(state, false).causes[0].key).toBe('form.count')
  })

  it('lazily propagates setup ref identity through nested objects and array items', () => {
    const state = createRenderCauseState()
    const form = ref({ nested: { count: 0 } })
    const list = ref([{ selected: false }])
    registerSetupRenderProfilerRefs(state, { form, list })
    const effect = new ReactiveEffect(
      () => [form.value.nested.count, list.value[0].selected],
      jest.fn()
    )
    effect.enableComputedTriggerTracking()
    effect.onTrigger = (info, computedRefs, refRefs) => appendRenderCause(state, info, 1, computedRefs, refRefs)
    effect.run()

    form.value.nested.count++
    list.value[0].selected = true

    expect(snapshotRenderCauses(state, false).causes).toEqual([{
      kind: 'reactive',
      source: 'setup',
      operation: 'set',
      key: 'form.count',
      count: 1
    }, {
      kind: 'reactive',
      source: 'setup',
      operation: 'set',
      key: 'list.selected',
      count: 1
    }])
  })

  it('attributes an unreturned ref dependency to its returned readonly computed field', () => {
    const state = createRenderCauseState()
    const hidden = ref(0)
    const visible = computed(() => hidden.value)
    registerSetupRenderProfilerRefs(state, { visible })
    const effect = new ReactiveEffect(() => visible.value, jest.fn())
    effect.enableComputedTriggerTracking()
    effect.onTrigger = (info, computedTriggerRefs) => {
      appendRenderCause(state, info, 1, computedTriggerRefs)
    }
    effect.run()

    hidden.value++

    expect(snapshotRenderCauses(state, false).causes).toEqual([{
      kind: 'reactive',
      source: 'setup',
      operation: 'trigger-ref',
      key: 'visible',
      count: 1
    }])
    expect(state.pendingCauses[0].cause).not.toHaveProperty('ref')
    expect(state.pendingCauses[0].cause).not.toHaveProperty('dep')
  })

  it('keeps a readonly computed field name for an underlying array mutation', () => {
    const state = createRenderCauseState()
    const hidden = ref([])
    const visibleItems = computed(() => hidden.value)
    registerSetupRenderProfilerRefs(state, { visibleItems })
    const effect = new ReactiveEffect(() => visibleItems.value.length, jest.fn())
    effect.enableComputedTriggerTracking()
    effect.onTrigger = (info, computedTriggerRefs) => {
      appendRenderCause(state, info, 1, computedTriggerRefs)
    }
    effect.run()

    hidden.value.push('item')

    expect(snapshotRenderCauses(state, false).causes).toEqual([{
      kind: 'reactive',
      source: 'setup',
      operation: 'array-mutation',
      key: 'visibleItems',
      method: 'push',
      count: 1
    }])
  })

  it('isolates readonly computed dependency names between component profiler states', () => {
    const hidden = ref(0)
    const firstVisible = computed(() => hidden.value)
    const secondVisible = computed(() => hidden.value)
    const firstState = createRenderCauseState()
    const secondState = createRenderCauseState()
    registerSetupRenderProfilerRefs(firstState, { firstVisible })
    registerSetupRenderProfilerRefs(secondState, { secondAlias: secondVisible })

    const firstEffect = new ReactiveEffect(() => firstVisible.value, jest.fn())
    firstEffect.enableComputedTriggerTracking()
    firstEffect.onTrigger = (info, refs) => appendRenderCause(firstState, info, 1, refs)
    firstEffect.run()
    const secondEffect = new ReactiveEffect(() => secondVisible.value, jest.fn())
    secondEffect.enableComputedTriggerTracking()
    secondEffect.onTrigger = (info, refs) => appendRenderCause(secondState, info, 1, refs)
    secondEffect.run()

    hidden.value++

    expect(snapshotRenderCauses(firstState, false).causes[0].key).toBe('firstVisible')
    expect(snapshotRenderCauses(secondState, false).causes[0].key).toBe('secondAlias')
  })

  it('recollects readonly computed dependencies without retaining stale ref mappings', () => {
    const state = createRenderCauseState()
    const useFirst = ref(true)
    const first = ref(0)
    const second = ref(0)
    const visible = computed(() => useFirst.value ? first.value : second.value)
    registerSetupRenderProfilerRefs(state, { visibleAlias: visible, visible })
    const effect = new ReactiveEffect(() => visible.value, jest.fn())
    effect.enableComputedTriggerTracking()
    effect.onTrigger = (info, computedTriggerRefs) => {
      appendRenderCause(state, info, 1, computedTriggerRefs)
    }
    effect.run()

    useFirst.value = false
    effect.run()
    commitRenderCauseSnapshot(state, snapshotRenderCauses(state, false), true)
    first.value++
    expect(state.pendingCauses).toEqual([])

    second.value++
    expect(snapshotRenderCauses(state, false).causes).toEqual([{
      kind: 'reactive',
      source: 'setup',
      operation: 'trigger-ref',
      key: 'visible/visibleAlias',
      count: 1
    }])
  })

  it('aggregates equal causes in one real template render', () => {
    const state = createRenderCauseState()
    appendRenderCause(state, { type: 'set', key: 'visible' }, 10)
    appendRenderCause(state, { type: 'set', key: 'visible' }, 11)
    appendRenderCause(state, { type: 'array-mutation', method: 'push' }, 12)

    expect(snapshotRenderCauses(state, false)).toEqual({
      maxCauseId: 3,
      causes: [{
        kind: 'reactive',
        source: 'unknown',
        operation: 'set',
        key: 'visible',
        count: 2
      }, {
        kind: 'reactive',
        source: 'unknown',
        operation: 'array-mutation',
        method: 'push',
        count: 1
      }],
      updateScheduledAt: 10,
      updateCount: 3
    })
  })

  it('keeps causes until the template render commits', () => {
    const state = createRenderCauseState()
    appendRenderCause(state, { type: 'set', key: 'visible' }, 10)

    const abortedSnapshot = snapshotRenderCauses(state, false)
    expect(snapshotRenderCauses(state, false).causes).toEqual(abortedSnapshot.causes)

    appendRenderCause(state, { type: 'add', key: 'selectedId' }, 20)
    consumeRenderCauseSnapshot(state, abortedSnapshot)

    expect(snapshotRenderCauses(state, false)).toEqual({
      maxCauseId: 2,
      causes: [{
        kind: 'reactive',
        source: 'unknown',
        operation: 'add',
        key: 'selectedId',
        count: 1
      }],
      updateScheduledAt: 20,
      updateCount: 1
    })
  })

  it('does not consume causes when a committed wrapper render hits the template cache', () => {
    const state = createRenderCauseState()
    appendRenderCause(state, { type: 'set', key: 'visible' }, 10)
    const snapshot = snapshotRenderCauses(state, false)

    commitRenderCauseSnapshot(state, snapshot, false)

    expect(state.hasCommittedTemplate).toBe(false)
    expect(snapshotRenderCauses(state, false).causes).toEqual(snapshot.causes)
  })

  it('reports mount while consuming changes captured before the first commit', () => {
    const state = createRenderCauseState()
    appendRenderCause(state, { kind: 'force-update' }, 10)

    const snapshot = snapshotRenderCauses(state, true)
    expect(snapshot.causes).toEqual([{ kind: 'mount', count: 1 }])
    commitRenderCauseSnapshot(state, snapshot, true)

    expect(state.hasCommittedTemplate).toBe(true)
    expect(state.pendingCauses).toEqual([])
  })

  it('bounds pending and emitted causes without losing the total trigger count', () => {
    const state = createRenderCauseState()
    for (let i = 0; i < MAX_PENDING_RENDER_CAUSES + 5; i++) {
      appendRenderCause(state, { type: 'set', key: `key-${i}` }, i)
    }

    const snapshot = snapshotRenderCauses(state, false)
    expect(state.pendingCauses).toHaveLength(MAX_PENDING_RENDER_CAUSES)
    expect(snapshot.causes.length).toBeLessThanOrEqual(MAX_RENDER_CAUSES)
    expect(snapshot.causes.reduce((total, cause) => total + cause.count, 0)).toBe(MAX_PENDING_RENDER_CAUSES + 5)
    expect(snapshot.updateScheduledAt).toBe(0)
    expect(snapshot.updateCount).toBe(MAX_PENDING_RENDER_CAUSES + 5)
  })
})
