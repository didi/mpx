const ExtendComponentsPlugin = require('../../lib/resolver/ExtendComponentsPlugin')

function resolveExtendComponent ({ mode, request }) {
  const plugin = new ExtendComponentsPlugin('source', mode, 'target')
  let handler
  const resolver = {
    ensureHook: jest.fn((hook) => hook),
    getHook: jest.fn(() => ({
      tapAsync: (name, fn) => {
        handler = fn
      }
    })),
    doResolve: jest.fn((target, resolveRequest, message, resolveContext, callback) => {
      callback(null, resolveRequest)
    })
  }

  plugin.apply(resolver)

  return new Promise((resolve) => {
    handler({ request }, {}, (err, result) => {
      resolve({ err, result, resolver })
    })
  })
}

describe('ExtendComponentsPlugin', () => {
  it('resolves section-list to rn implementation', async () => {
    const { err, result, resolver } = await resolveExtendComponent({
      mode: 'ios',
      request: '@mpxjs/webpack-plugin/lib/runtime/components/extends/section-list?isComponent=true'
    })

    expect(err).toBeFalsy()
    expect(result.request).toBe('@mpxjs/webpack-plugin/lib/runtime/components/react/dist/mpx-section-list.jsx')
    expect(resolver.doResolve).toHaveBeenCalled()
  })

  it('rejects section-list in unsupported modes', async () => {
    const { err, resolver } = await resolveExtendComponent({
      mode: 'web',
      request: '@mpxjs/webpack-plugin/lib/runtime/components/extends/section-list'
    })

    expect(err).toBeTruthy()
    expect(err.message).toContain('cannot be used in web mode')
    expect(resolver.doResolve).not.toHaveBeenCalled()
  })

  it('resolves sticky components registration path', async () => {
    const { err, result } = await resolveExtendComponent({
      mode: 'android',
      request: '@mpxjs/webpack-plugin/lib/runtime/components/extends/sticky-header'
    })

    expect(err).toBeFalsy()
    expect(result.request).toBe('@mpxjs/webpack-plugin/lib/runtime/components/react/dist/mpx-sticky-header.jsx')
  })
})
