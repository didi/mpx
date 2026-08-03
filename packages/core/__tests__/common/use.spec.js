global.__mpx_mode__ = 'wx'
global.mpxGlobal = {}
global.wx = {}

jest.mock('@mpxjs/perf', () => ({}), { virtual: true })

const Mpx = require('../../src').default

describe('Mpx.use', () => {
  it('should mark an object plugin as installed', () => {
    const plugin = {
      install: jest.fn()
    }

    Mpx.use(plugin)

    expect(plugin.install).toHaveBeenCalledTimes(1)
    expect(plugin.__installed).toBe(true)
  })

  it('should mark a function plugin as installed', () => {
    const plugin = jest.fn()

    Mpx.use(plugin)

    expect(plugin).toHaveBeenCalledTimes(1)
    expect(plugin.__installed).toBe(true)
  })
})
