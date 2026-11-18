const fs = require('node:fs')
const path = require('node:path')
const stylus = require('stylus')
const postcss = require('postcss')
const { MPX_ROOT_VIEW } = require('../lib/utils/const')
const styleCompiler = require('../lib/style-compiler')
const transSpecial = require('../lib/style-compiler/plugins/trans-special')
const addQuery = require('../lib/utils/add-query')

describe('web compatibility style', () => {
  it('transforms page selectors introduced by a later plugin', async () => {
    const result = await postcss([
      transSpecial({ id: 'm123', transPage: true }),
      {
        postcssPlugin: 'expand-import',
        Once (root) {
          root.walkAtRules('import', node => {
            node.replaceWith(postcss.parse('page { color: red } @media (min-width: 600px) { page { color: blue } }').nodes)
          })
        }
      }
    ]).process('@import "./common.css";', { from: undefined })
    expect(result.css).toBe('.mpx-page { color: red } @media (min-width: 600px) { .mpx-page { color: blue } }')
  })

  it.each([false, true])('transforms page selectors with scoped=%s', async (scoped) => {
    const css = await new Promise((resolve, reject) => {
      styleCompiler.call({
        resourcePath: '/page.mpx',
        resource: addQuery('/page.mpx', { mpxStyleOptions: JSON.stringify({ scoped, mid: 'm123' }) }),
        cacheable () {},
        getMpx: () => ({
          mode: 'web',
          webConfig: {},
          projectRoot: __dirname,
          postcssInlineConfig: { ignoreConfigFile: true }
        }),
        async: () => (error, css) => error ? reject(error) : resolve(css)
      }, 'page { color: red } @media (min-width: 600px) { page { color: blue } }')
    })
    const selector = scoped ? '.mpx-page.m123' : '.mpx-page'
    expect(css).toBe(`${selector} { color: red } @media (min-width: 600px) { ${selector} { color: blue } }`)
  })

  it('should include migrated defaults without ali-only rules', () => {
    const filename = path.resolve(__dirname, '../lib/runtime/base.styl')
    const css = stylus(fs.readFileSync(filename, 'utf8')).set('filename', filename).render()

    expect(css).toContain(`.${MPX_ROOT_VIEW} {\n  display: initial;\n}`)
    expect(css).toMatch(/\.mpx-page \{[^}]*line-height: normal;/)
    expect(css).toMatch(/\.mpx-page \{[^}]*position: relative;/)
    expect(css).not.toContain('white-space: inherit')
    expect(css).not.toContain('mpx-scrollbar-hidden')
  })
})
