global.mpxGlobal = {}

jest.mock('../../src/platform/patch/lifecycle/index', () => {
  return jest.requireActual(`../../src/platform/patch/lifecycle/index.${global.__mpx_mode__}`)
})

it.each([['ali', 'wxToAli'], ['swan', 'wxToSwan']])('merges render hooks across %s conversion', (mode, convertMode) => {
  global.__mpx_mode__ = mode
  jest.resetModules()
  const mergeOptions = require('../../src/core/mergeOptions').default
  const calls = []
  const options = {
    mpxConvertMode: convertMode,
    mixins: [{ renderTracked (event) { calls.push(['mixin', this, event]) } }],
    renderTracked (event) { calls.push(['component', this, event]) }
  }
  const merged = mergeOptions(mergeOptions(options, 'component', true), 'component', false)
  const target = {}
  const event = {}
  merged.renderTracked.call(target, event)
  expect(calls).toEqual([['mixin', target, event], ['component', target, event]])
  expect(merged.methods?.renderTracked).toBeUndefined()
})
