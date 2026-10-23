global.__mpx_mode__ = 'wx'
global.__mpx_dynamic_runtime__ = false
global.mpxGlobal = {}
global.wx = {}

jest.mock('@mpxjs/perf', () => ({}), { virtual: true })

it('ignores production debug hooks without changing reactive updates', async () => {
  const previousEnv = process.env.NODE_ENV
  process.env.NODE_ENV = 'production'
  jest.resetModules()
  try {
    const { ref, computed, watchEffect, onRenderTracked, onRenderTriggered, nextTick } = require('../../src')
    const onTrack = jest.fn()
    const onTrigger = jest.fn()
    const instance = { hooks: {} }
    onRenderTracked(onTrack, instance)
    onRenderTriggered(onTrigger, instance)
    const count = ref(0)
    const doubled = computed(() => count.value * 2, { onTrack, onTrigger })
    const getter = jest.fn(() => doubled.value)
    const stop = watchEffect(getter, { onTrack, onTrigger })
    count.value++
    await nextTick()
    expect(getter).toHaveBeenCalledTimes(2)
    expect(doubled.value).toBe(2)
    expect(instance.hooks).toEqual({})
    expect(onTrack).not.toHaveBeenCalled()
    expect(onTrigger).not.toHaveBeenCalled()
    stop()
  } finally {
    process.env.NODE_ENV = previousEnv
    jest.resetModules()
  }
})
