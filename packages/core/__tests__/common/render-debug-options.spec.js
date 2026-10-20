global.mpxGlobal = {}

jest.mock('../../src/platform/patch/lifecycle/index', () => {
  const mode = ['ali', 'swan', 'web'].includes(global.__mpx_mode__) ? global.__mpx_mode__ : 'wx'
  return jest.requireActual(`../../src/platform/patch/lifecycle/index.${mode}`)
})

it.each([
  ['wx', 'default'],
  ['ali', 'wxToAli'],
  ['swan', 'wxToSwan'],
  ['qq', 'wxToQq'],
  ['tt', 'wxToTt'],
  ['jd', 'wxToJd'],
  ['dd', 'wxToDd'],
  ['ks', 'wxToKs'],
  ['ios', 'wxToIos'],
  ['android', 'wxToAndroid'],
  ['harmony', 'wxToHarmony'],
  ['web', 'wxToWeb'],
  ['ali', 'default'],
  ['swan', 'default']
])('preserves render debug hook merging for %s with %s', (mode, convertMode) => {
  global.__mpx_mode__ = mode
  jest.resetModules()
  const mergeOptions = require('../../src/core/mergeOptions').default
  const transferOptions = require('../../src/core/transferOptions').default
  const { injectMixins } = require('../../src/core/injectMixins')
  const { RENDERTRACKED, RENDERTRIGGERED } = require('../../src/core/innerLifecycle')
  const calls = []
  injectMixins({
    renderTracked (event) { calls.push(['global tracked', this, event]) },
    renderTriggered (event) { calls.push(['global triggered', this, event]) }
  })
  ;['page', 'component'].forEach(type => {
    calls.length = 0
    const target = {}
    const event = {}
    const { rawOptions } = transferOptions({
      mpxConvertMode: convertMode,
      mixins: [{
        mixins: [{
          renderTracked (event) { calls.push(['nested tracked', this, event]) },
          renderTriggered (event) { calls.push(['nested triggered', this, event]) }
        }],
        renderTracked (event) { calls.push(['mixin tracked', this, event]) },
        renderTriggered (event) { calls.push(['mixin triggered', this, event]) }
      }],
      renderTracked (event) { calls.push(['tracked', this, event]) },
      renderTriggered (event) { calls.push(['triggered', this, event]) }
    }, type)
    const merged = mergeOptions(rawOptions, type, false)
    expect(merged).not.toHaveProperty('renderTracked')
    expect(merged).not.toHaveProperty('renderTriggered')
    expect(merged).not.toHaveProperty('methods.renderTracked')
    expect(merged).not.toHaveProperty('methods.renderTriggered')
    merged[RENDERTRACKED].call(target, event)
    merged[RENDERTRIGGERED].call(target, event)
    expect(calls).toEqual([
      ['global tracked', target, event],
      ['nested tracked', target, event],
      ['mixin tracked', target, event],
      ['tracked', target, event],
      ['global triggered', target, event],
      ['nested triggered', target, event],
      ['mixin triggered', target, event],
      ['triggered', target, event]
    ])
  })
})
