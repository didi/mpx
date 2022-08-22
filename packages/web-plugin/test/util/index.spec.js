const { preProcessDefs } = require('../../lib/utils/index')

describe('case for common util', () => {
  it('should process basic defs', () => {
    const defs = { 'process.env.MPX_ENV': true }
    const rs = preProcessDefs(defs)
    expect(rs).toEqual({ process: { env: { MPX_ENV: true } } })
  })

  it('should process defs success', () => {
    const defs = { 'process.env.MPX_ENV': true, 'process.env.MPX_ENV2': 'true', '__MPX_TEST_DEF1__': 123, '__MPX_TEST_DEF2__': false, '__MPX_TEST_DEF3__': 'string' }
    const rs = preProcessDefs(defs)
    expect(rs).toEqual({ process: { env: { MPX_ENV: true, MPX_ENV2: 'true' } }, __MPX_TEST_DEF1__: 123, __MPX_TEST_DEF2__: false, __MPX_TEST_DEF3__: 'string' })
  })
})
