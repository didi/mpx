const parseQuery = require('loader-utils').parseQuery
const AddModePlugin = require('../lib/resolver/AddModePlugin')
const MpxWebpackPlugin = require('../lib')

function createResolver (resolve) {
  let handler
  const resolver = {
    ensureHook: jest.fn(() => 'file'),
    getHook: jest.fn(() => ({
      tapAsync (name, fn) {
        handler = fn
      }
    })),
    doResolve: jest.fn(resolve)
  }
  return { resolver, run: (request, callback) => handler(request, {}, callback) }
}

describe('AddModePlugin', () => {
  it('does not modify resources after mode selection', (done) => {
    const { resolver, run } = createResolver()
    new AddModePlugin('before-file', 'ali', {
      fileConditionRules: { include: () => true }
    }, 'file').apply(resolver)
    const request = { path: '/src/native.js', mode: 'ali' }
    run(request, (err) => {
      expect(err).toBeUndefined()
      expect(request.query).toBeUndefined()
      done()
    })
  })

  it('resolves the default mode fallback without source mode query', (done) => {
    const { resolver, run } = createResolver((target, request, message, context, callback) => {
      callback(null, request.path.includes('.ios.') ? request : null)
    })
    new AddModePlugin('before-file', 'android', {
      defaultMode: 'ios',
      fileConditionRules: { include: () => true }
    }, 'file').apply(resolver)
    run({ path: '/src/card.mpx' }, (err, result) => {
      expect(err).toBeNull()
      expect(result.path).toBe('/src/card.ios.mpx')
      expect(parseQuery(result.query).srcMode).toBeUndefined()
      expect(parseQuery(result.query).mode).toBeUndefined()
      done()
    })
  })
})

describe('srcModeRules', () => {
  it('marks the final resolved resource and request', () => {
    const plugin = new MpxWebpackPlugin({
      mode: 'ali',
      srcModeRules: { ali: { include: /native/ } }
    })
    const data = {
      resource: '/src/native.js',
      request: '/loader.js!/src/native.js'
    }
    plugin.runSrcModeRules(data)
    expect(data.resource).toContain('srcMode=ali')
    expect(data.request).toContain('srcMode=ali')
  })

  it('does not override an explicit source mode', () => {
    const plugin = new MpxWebpackPlugin({
      mode: 'ali',
      srcModeRules: { ali: { include: () => true } }
    })
    const data = {
      resource: '/src/native.js?srcMode=wx',
      request: '/loader.js!/src/native.js?srcMode=wx'
    }
    plugin.runSrcModeRules(data)
    expect(data.resource).toContain('srcMode=wx')
    expect(data.resource).not.toContain('srcMode=ali')
  })

  it('ignores rules for other output modes', () => {
    const plugin = new MpxWebpackPlugin({
      mode: 'ali',
      srcModeRules: {
        wx: { include: () => true }
      }
    })
    const data = {
      resource: '/src/card.mpx',
      request: '/src/card.mpx'
    }
    plugin.runSrcModeRules(data)
    expect(data.resource).toBe('/src/card.mpx')
    expect(data.request).toBe('/src/card.mpx')
  })
})
