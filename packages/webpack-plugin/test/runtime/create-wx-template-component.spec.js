global.__mpx_mode__ = 'web'
global.mpxGlobal = {
  __mpx: {
    isReactive: () => false,
    isRef: () => false
  }
}
const { compileTemplate } = require('vue/compiler-sfc')
const { createWxTemplateComponent } = require('../../lib/runtime/optionProcessor')

function buildRenderFromSource (source) {
  const { code, errors } = compileTemplate({ source, filename: 'create-wx-tpl-test.vue' })
  if (errors && errors.length) {
    throw new Error(String(errors[0]))
  }
  // eslint-disable-next-line no-new-func
  return new Function(code + '; return { render, staticRenderFns }')()
}

describe('createWxTemplateComponent', () => {
  it('proxies $slots to __mpxHost.$slots via getter (§2.8)', () => {
    const { render, staticRenderFns } = buildRenderFromSource('<div/>')
    const opt = createWxTemplateComponent({
      name: 'mpx-wx-tpl-test',
      render,
      staticRenderFns
    })
    const hostSlots = { default: [1], header: [2] }
    const vm = {
      __mpxHost: {
        $options: { methods: {}, components: {} },
        $slots: hostSlots
      },
      $options: { methods: {}, components: {} },
      mpxData: {}
    }
    opt.created.call(vm)
    expect(vm.$slots).toBe(hostSlots)
    expect(vm.$slots.default).toEqual([1])
    hostSlots.footer = [3]
    expect(vm.$slots.footer).toEqual([3])
  })

  it('does not throw when __mpxHost is missing', () => {
    const { render, staticRenderFns } = buildRenderFromSource('<div/>')
    const opt = createWxTemplateComponent({
      name: 'mpx-wx-tpl-test',
      render,
      staticRenderFns
    })
    const vm = {
      __mpxHost: null,
      $options: { methods: {}, components: {} },
      mpxData: {}
    }
    expect(() => opt.created.call(vm)).not.toThrow()
  })

  it('mpxData proxy uses getter: new object literal on prop update still reads current fields', () => {
    const { render, staticRenderFns } = buildRenderFromSource('<div/>')
    const opt = createWxTemplateComponent({
      name: 'mpx-wx-tpl-test',
      render,
      staticRenderFns
    })
    const vm = {
      __mpxHost: {
        $options: { methods: {}, components: {} },
        $slots: {}
      },
      $options: { methods: {}, components: {} },
      mpxData: { msg: 'a' }
    }
    opt.created.call(vm)
    expect(vm.msg).toBe('a')
    vm.mpxData = { msg: 'b' }
    expect(vm.msg).toBe('b')
  })

  it('throws when render is missing', () => {
    expect(() =>
      createWxTemplateComponent({ name: 'x' })
    ).toThrow(/requires a build-time `render`/)
  })
})
