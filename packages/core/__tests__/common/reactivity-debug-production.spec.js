global.__mpx_mode__ = 'wx'
global.__mpx_dynamic_runtime__ = false
global.mpxGlobal = {}
global.wx = {}

jest.mock('@mpxjs/perf', () => ({}), { virtual: true })

describe('production reactivity debugger hooks', () => {
  it('ignores debugger options and registrations without changing reactive updates', async () => {
    const previousEnv = process.env.NODE_ENV
    process.env.NODE_ENV = 'production'
    jest.resetModules()
    try {
      const {
        ref, computed, watchEffect, onRenderTracked, onRenderTriggered, nextTick
      } = require('../../src')
      const { default: MpxProxy, setCurrentInstance, unsetCurrentInstance } = require('../../src/core/proxy')
      const debug = require('../../src/observer/debug')
      const createInfo = jest.spyOn(debug, 'createDebuggerInfo')
      const registerTarget = jest.spyOn(debug, 'registerRefDebugTarget')
      const onTrack = jest.fn()
      const onTrigger = jest.fn()
      const count = ref(0)
      const doubled = computed(() => count.value * 2, { onTrack, onTrigger })
      const getter = jest.fn(() => doubled.value)
      const stop = watchEffect(getter, { onTrack, onTrigger })
      const proxy = new MpxProxy({}, {})
      setCurrentInstance(proxy)
      onRenderTracked(onTrack)
      onRenderTriggered(onTrigger)
      unsetCurrentInstance()
      expect(proxy.hooks).toEqual({})
      count.value++
      await nextTick()
      expect(getter).toHaveBeenCalledTimes(2)
      expect(doubled.value).toBe(2)
      expect(onTrack).not.toHaveBeenCalled()
      expect(onTrigger).not.toHaveBeenCalled()
      expect(createInfo).not.toHaveBeenCalled()
      expect(registerTarget).not.toHaveBeenCalled()
      stop()
      proxy.unmounted()
    } finally {
      process.env.NODE_ENV = previousEnv
      jest.resetModules()
    }
  })
})
