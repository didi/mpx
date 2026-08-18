import { ReactiveEffect } from '../../src/observer/effect'
import { reactive, set, del } from '../../src/observer/reactive'

const createTrackedEffect = (fn) => {
  const scheduler = jest.fn()
  const onTrigger = jest.fn()
  const effect = new ReactiveEffect(fn, scheduler)
  effect.onTrigger = onTrigger
  effect.run()
  return { effect, scheduler, onTrigger }
}

describe('reactive trigger metadata', () => {
  it('reports set, add and delete operations with only their key', () => {
    const state = reactive({
      value: 1,
      nested: {}
    })
    const { scheduler, onTrigger } = createTrackedEffect(() => {
      return [state.value, state.nested]
    })

    state.value = 2
    set(state.nested, 'added', true)
    del(state.nested, 'added')

    expect(onTrigger.mock.calls).toEqual([
      [{ type: 'set', key: 'value' }],
      [{ type: 'add', key: 'added' }],
      [{ type: 'delete', key: 'added' }]
    ])
    expect(scheduler).toHaveBeenCalledTimes(3)
  })

  it.each([
    ['push', [1]],
    ['pop', []],
    ['shift', []],
    ['unshift', [0]],
    ['splice', [0, 1, 2]],
    ['sort', []],
    ['reverse', []]
  ])('reports the %s array mutation without retaining arguments', (method, args) => {
    const state = reactive({ list: [1] })
    const { scheduler, onTrigger } = createTrackedEffect(() => state.list)

    state.list[method](...args)

    expect(onTrigger).toHaveBeenCalledWith({
      type: 'array-mutation',
      method
    })
    expect(onTrigger.mock.calls[0][0]).not.toHaveProperty('args')
    expect(scheduler).toHaveBeenCalledTimes(1)
  })

  it('does not report unchanged assignments', () => {
    const state = reactive({ value: 1 })
    const { scheduler, onTrigger } = createTrackedEffect(() => state.value)

    state.value = 1

    expect(onTrigger).not.toHaveBeenCalled()
    expect(scheduler).not.toHaveBeenCalled()
  })

  it('adds an explicit source without retaining the reactive target', () => {
    const state = reactive({
      value: 1,
      nested: { visible: false },
      list: []
    }, 'data')
    const { onTrigger } = createTrackedEffect(() => {
      return [state.value, state.nested.visible, state.list]
    })

    state.value = 2
    state.nested.visible = true
    state.list.push({ id: 1 })

    expect(onTrigger.mock.calls).toEqual([
      [{ source: 'data', type: 'set', key: 'value' }],
      [{ source: 'data', type: 'set', key: 'visible' }],
      [{ source: 'data', type: 'array-mutation', method: 'push' }]
    ])
    onTrigger.mock.calls.forEach(([info]) => {
      expect(info).not.toHaveProperty('target')
      expect(info).not.toHaveProperty('newValue')
      expect(info).not.toHaveProperty('oldValue')
    })
  })

  it('does not traverse non-reactive objects while initializing a source', () => {
    const readNested = jest.fn()
    const external = Object.defineProperty(new Date(), 'nested', {
      enumerable: true,
      get: readNested
    })
    reactive({ external }, 'data')

    expect(readNested).not.toHaveBeenCalled()
  })

  it('only calls onTrigger when the effect is actually scheduled', () => {
    const state = reactive({ value: 0 })
    const scheduler = jest.fn()
    const onTrigger = jest.fn()
    let shouldMutate = true
    const effect = new ReactiveEffect(() => {
      if (shouldMutate) {
        shouldMutate = false
        state.value++
      }
      return state.value
    }, scheduler)
    effect.onTrigger = onTrigger

    effect.run()
    expect(onTrigger).not.toHaveBeenCalled()
    expect(scheduler).not.toHaveBeenCalled()

    effect.pause()
    state.value++
    expect(onTrigger).not.toHaveBeenCalled()
    expect(scheduler).not.toHaveBeenCalled()

    effect.resume()
    expect(onTrigger).not.toHaveBeenCalled()
    expect(scheduler).toHaveBeenCalledTimes(1)
  })
})
