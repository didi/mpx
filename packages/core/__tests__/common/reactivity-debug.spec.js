global.__mpx_mode__ = 'wx'
global.__mpx_dynamic_runtime__ = false
global.mpxGlobal = {}
global.wx = {}

jest.mock('@mpxjs/perf', () => ({}), { virtual: true })

const {
  reactive, ref, shallowRef, customRef, toRef, triggerRef,
  computed, watch, watchEffect, nextTick, set, del
} = require('../../src')
const { ReactiveEffect } = require('../../src/observer/effect')

function observe (getter, onTrack = jest.fn(), onTrigger = jest.fn()) {
  const effect = new ReactiveEffect(getter)
  Object.assign(effect, { onTrack, onTrigger })
  effect.run()
  return { effect, onTrack, onTrigger }
}

describe('reactivity debugger events', () => {
  it('reports reads and synchronous notifications before the watch callback', () => {
    const state = reactive({ count: 0 })
    const order = []
    const onTrack = jest.fn()
    const onTrigger = jest.fn(event => order.push(['trigger', event.newValue]))
    const callback = jest.fn(value => order.push(['callback', value]))
    const stop = watch(() => state.count, callback, { flush: 'sync', onTrack, onTrigger })

    expect(onTrack.mock.calls[0][0]).toMatchObject({ target: state, type: 'get', key: 'count' })
    state.count = 1
    expect(onTrigger.mock.calls[0][0]).toMatchObject({
      target: state, type: 'set', key: 'count', oldValue: 0, newValue: 1
    })
    expect(onTrigger.mock.calls[0][0].effect).toBe(onTrack.mock.calls[0][0].effect)
    expect(order).toEqual([['trigger', 1], ['callback', 1]])
    state.count = 1
    expect(onTrigger).toHaveBeenCalledTimes(1)
    stop()
    state.count = 2
    expect(onTrigger).toHaveBeenCalledTimes(1)
  })

  it.each([ref, shallowRef])('uses the public ref identity for value events', (createRef) => {
    const count = createRef(0)
    const { effect, onTrack, onTrigger } = observe(() => count.value)
    expect(onTrack.mock.calls[0][0]).toMatchObject({ target: count, key: 'value', type: 'get' })
    count.value = 1
    expect(onTrigger.mock.calls[0][0]).toMatchObject({
      target: count, key: 'value', type: 'set', oldValue: 0, newValue: 1
    })
    effect.stop()
  })

  it('preserves the source property target of toRef and nested ref values', () => {
    const source = reactive({ count: 0 })
    const count = toRef(source, 'count')
    const first = observe(() => count.value)
    expect(first.onTrack.mock.calls[0][0].target).toBe(source)
    count.value++
    expect(first.onTrigger.mock.calls[0][0]).toMatchObject({ target: source, key: 'count' })
    first.effect.stop()

    const nested = ref({ name: 'first' })
    const second = observe(() => nested.value.name)
    expect(second.onTrack.mock.calls.map(([event]) => [event.target, event.key])).toEqual([
      [nested, 'value'], [nested.value, 'name']
    ])
    nested.value.name = 'second'
    expect(second.onTrigger.mock.calls[0][0].target).toBe(nested.value)
    second.effect.stop()
  })

  it('normalizes customRef and explicit shallowRef triggering without synthetic values', () => {
    let value = 0
    const custom = customRef((track, trigger) => ({
      get () { track(); return value },
      set (next) { value = next; trigger() }
    }))
    const first = observe(() => custom.value)
    const shallowValue = { count: 0 }
    const shallow = shallowRef(shallowValue)
    const second = observe(() => shallow.value)
    const stop = watch(custom, () => { shallow.value = shallowValue }, { flush: 'sync' })
    expect(first.onTrack.mock.calls[0][0].target).toBe(custom)
    custom.value = 10
    expect(first.onTrigger.mock.calls[0][0]).toMatchObject({ target: custom, type: 'set', key: 'value' })
    expect(first.onTrigger.mock.calls[0][0]).not.toHaveProperty('newValue')
    expect(first.onTrigger.mock.calls[0][0]).not.toHaveProperty('oldValue')
    expect(second.onTrigger).not.toHaveBeenCalled()
    stop()
    first.effect.stop()

    shallow.value.count++
    expect(second.onTrigger).not.toHaveBeenCalled()
    triggerRef(shallow)
    expect(second.onTrigger.mock.calls[0][0]).toMatchObject({ target: shallow, type: 'set', key: 'value' })
    expect(second.onTrigger.mock.calls[0][0]).not.toHaveProperty('newValue')
    second.effect.stop()
  })

  it('reports property additions, deletions and array mutation methods on existing deps', () => {
    const state = reactive({ object: {}, list: [] })
    const object = state.object
    const list = state.list
    const first = observe(() => state.object)
    set(object, 'name', 'Mpx')
    expect(first.onTrigger.mock.calls[0][0]).toMatchObject({
      target: object, type: 'add', key: 'name', newValue: 'Mpx'
    })
    del(object, 'name')
    expect(first.onTrigger.mock.calls[1][0]).toMatchObject({ target: object, type: 'delete', key: 'name' })
    expect(first.onTrigger.mock.calls[1][0]).not.toHaveProperty('oldValue')
    first.effect.stop()

    const second = observe(() => state.list)
    list.push('first')
    list.splice(0, 1, 'second')
    expect(second.onTrigger.mock.calls.map(([event]) => [event.target, event.type, event.key])).toEqual([
      [list, 'array mutation', 'push'], [list, 'array mutation', 'splice']
    ])
    list[0] = 'untracked'
    expect(second.onTrigger).toHaveBeenCalledTimes(2)
    second.effect.stop()
  })

  it('preserves computed caching and Vue 2.7 dependency forwarding', () => {
    const count = ref(0)
    const getter = jest.fn(() => count.value * 2)
    const onTrack = jest.fn()
    const onTrigger = jest.fn()
    const doubled = computed(getter, { onTrack, onTrigger })
    const outer = observe(() => doubled.value)
    expect(getter).toHaveBeenCalledTimes(1)
    expect(onTrack.mock.calls[0][0]).toMatchObject({ target: count, type: 'get', key: 'value' })
    expect(outer.onTrack.mock.calls[0][0]).toMatchObject({ target: doubled, type: 'get', key: 'value' })
    expect(outer.onTrack).toHaveBeenCalledTimes(1)
    expect(doubled.value).toBe(0)
    expect(getter).toHaveBeenCalledTimes(1)
    count.value = 2
    expect(onTrigger.mock.calls[0][0].target).toBe(count)
    expect(outer.onTrigger.mock.calls[0][0].target).toBe(count)
    expect(doubled.value).toBe(4)
    expect(getter).toHaveBeenCalledTimes(2)
    outer.effect.stop()

    const writable = computed({ get: () => count.value, set: value => { count.value = value } }, { onTrack })
    writable.value = 3
    expect(writable.value).toBe(3)
  })

  it('forwards watchEffect debugger options without changing scheduling', async () => {
    const count = ref(0)
    const onTrack = jest.fn()
    const onTrigger = jest.fn()
    const getter = jest.fn(() => count.value)
    const stop = watchEffect(getter, { onTrack, onTrigger })
    await nextTick()
    expect(getter).toHaveBeenCalledTimes(1)
    expect(onTrack.mock.calls[0][0].target).toBe(count)
    count.value++
    expect(onTrigger).toHaveBeenCalledTimes(1)
    expect(getter).toHaveBeenCalledTimes(1)
    await nextTick()
    expect(getter).toHaveBeenCalledTimes(2)
    stop()
  })

  it('does not collect properties read by a debugger callback and restores tracking after errors', () => {
    const state = reactive({ count: 0, diagnostic: 0 })
    const error = jest.spyOn(console, 'error').mockImplementation(() => {})
    const getter = jest.fn(() => state.count)
    const { effect } = observe(getter, () => {
      Number(state.diagnostic)
      throw new Error('debug callback error')
    }, () => { Number(state.diagnostic) })
    state.diagnostic++
    expect(getter).toHaveBeenCalledTimes(1)
    state.count++
    expect(getter).toHaveBeenCalledTimes(2)
    expect(effect.deps).toHaveLength(1)
    expect(error).toHaveBeenCalled()
    effect.stop()
    error.mockRestore()
  })
})
