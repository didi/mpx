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
      const mergeOptions = require('../../src/core/mergeOptions').default
      const { renderHelperDefs } = require('../../src/platform/builtInMixins/renderHelperMixin')
      const debug = require('../../src/observer/debug')
      const createInfo = jest.spyOn(debug, 'createDebuggerInfo')
      const registerTarget = jest.spyOn(debug, 'registerRefDebugTarget')
      const onTrack = jest.fn()
      const onTrigger = jest.fn()
      const count = ref(0)
      const doubled = computed(() => count.value * 2, { onTrack, onTrigger })
      const getter = jest.fn(() => doubled.value)
      const stop = watchEffect(getter, { onTrack, onTrigger })
      const target = Object.assign({
        data: {},
        __getProps: () => ({}),
        __render: jest.fn(),
        __injectedRender (_i, _c, _r, _sc) {
          _sc('count')
          _sc('doubled')
          _r()
        }
      }, renderHelperDefs)
      const proxy = new MpxProxy(mergeOptions({
        data: { count: 0 },
        computed: { doubled () { return this.count * 2 } },
        renderTracked: onTrack,
        renderTriggered: onTrigger
      }, 'component', true), target)
      target.__mpxProxy = proxy
      setCurrentInstance(proxy)
      onRenderTracked(onTrack)
      onRenderTriggered(onTrigger)
      unsetCurrentInstance()
      proxy.created()
      expect(proxy.hooks).toEqual({})
      expect(proxy.effect.onTrack).toBeUndefined()
      expect(proxy.effect.onTrigger).toBeUndefined()
      count.value++
      target.count++
      await nextTick()
      expect(getter).toHaveBeenCalledTimes(2)
      expect(doubled.value).toBe(2)
      expect(target.__render.mock.calls.at(-1)[0]).toEqual({ count: 1, doubled: 2 })
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
