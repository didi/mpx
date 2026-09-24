const fs = require('node:fs')
const path = require('node:path')
const stylus = require('stylus')
const { MPX_ROOT_VIEW } = require('../lib/utils/const')

describe('web compatibility style', () => {
  it('should include migrated defaults without ali-only rules', () => {
    const filename = path.resolve(__dirname, '../lib/runtime/base.styl')
    const css = stylus(fs.readFileSync(filename, 'utf8')).set('filename', filename).render()

    expect(css).toContain(`.${MPX_ROOT_VIEW} {\n  display: initial;\n}`)
    expect(css).toMatch(/page \{[^}]*line-height: normal;/)
    expect(css).not.toContain('white-space: inherit')
    expect(css).not.toContain('mpx-scrollbar-hidden')
  })
})
