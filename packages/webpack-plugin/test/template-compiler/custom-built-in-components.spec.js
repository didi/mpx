const compiler = require('../../lib/template-compiler/compiler')

const baseParseOpts = {
  usingComponents: [],
  usingComponentsInfo: {},
  externalClasses: [],
  srcMode: 'wx',
  warn: jest.fn(),
  error: jest.fn(),
  defs: {
    __mpx_mode__: 'web',
    __mpx_src_mode__: 'wx',
    __mpx_env__: ''
  }
}

describe('customBuiltInComponents in processBuiltInComponents', () => {
  it('wx key maps user path onto runtime tag in meta.builtInComponentsMap (web)', () => {
    const { meta } = compiler.parse('<view></view>', Object.assign({}, baseParseOpts, {
      mode: 'web',
      customBuiltInComponents: { view: '/abs/CustomView.vue' }
    }))
    expect(meta.builtInComponentsMap['mpx-view']).toBe('/abs/CustomView.vue')
  })

  it('uses default path when no custom (web)', () => {
    const { meta } = compiler.parse('<scroll-view></scroll-view>', Object.assign({}, baseParseOpts, {
      mode: 'web'
    }))
    expect(meta.builtInComponentsMap['mpx-scroll-view']).toMatch(/mpx-scroll-view/)
  })

  it('wx key on RN mode', () => {
    const { meta } = compiler.parse('<view></view>', Object.assign({}, baseParseOpts, {
      mode: 'ios',
      defs: {
        __mpx_mode__: 'ios',
        __mpx_src_mode__: 'wx',
        __mpx_env__: ''
      },
      customBuiltInComponents: { view: '@pkg/MyView.mpx' }
    }))
    expect(meta.builtInComponentsMap['mpx-view']).toBe('@pkg/MyView.mpx')
  })
})
