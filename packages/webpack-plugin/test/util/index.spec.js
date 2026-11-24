const processDefs = require('../../lib/utils/process-defs')
const { getPartialCompileRules, isPartialCompileExcluded } = require('../../lib/utils/partial-compile-rules')

describe('case for common util', () => {
  it('should process basic defs', () => {
    const defs = { 'process.env.MPX_ENV': true }
    const rs = processDefs(defs)
    expect(rs).toEqual({ process: { env: { MPX_ENV: true } } })
  })

  it('should process defs success', () => {
    const defs = { 'process.env.MPX_ENV': true, 'process.env.MPX_ENV2': 'true', __MPX_TEST_DEF1__: 123, __MPX_TEST_DEF2__: false, __MPX_TEST_DEF3__: 'string' }
    const rs = processDefs(defs)
    expect(rs).toEqual({ process: { env: { MPX_ENV: true, MPX_ENV2: 'true' } }, __MPX_TEST_DEF1__: 123, __MPX_TEST_DEF2__: false, __MPX_TEST_DEF3__: 'string' })
  })

  it('should keep legacy partialCompileRules for pages only', () => {
    const rules = {
      include: '/pages/order'
    }

    expect(getPartialCompileRules(rules, 'page')).toBe(rules)
    expect(getPartialCompileRules(rules, 'component')).toBe(null)
    expect(isPartialCompileExcluded('/project/pages/order/index.mpx', rules, 'page')).toBe(false)
    expect(isPartialCompileExcluded('/project/pages/home/index.mpx', rules, 'page')).toBe(true)
    expect(isPartialCompileExcluded('/project/components/card/index.mpx', rules, 'component')).toBe(false)
  })

  it('should process typed partialCompileRules', () => {
    const rules = {
      pages: {
        include: '/pages/order'
      },
      components: {
        include: /components\/keep/
      }
    }

    expect(getPartialCompileRules(rules, 'page')).toBe(rules.pages)
    expect(getPartialCompileRules(rules, 'component')).toBe(rules.components)
    expect(isPartialCompileExcluded('/project/components/keep/index.mpx', rules, 'component')).toBe(false)
    expect(isPartialCompileExcluded('/project/components/heavy/index.mpx', rules, 'component')).toBe(true)
  })
})
