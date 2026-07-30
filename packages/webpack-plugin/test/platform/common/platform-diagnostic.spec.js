const { SourceMapGenerator } = require('source-map')
const stylus = require('stylus')
const parseComponent = require('../../../lib/parser')
const getRulesRunner = require('../../../lib/platform')
const { getClassMap } = require('../../../lib/react/style-helper')
const { parse } = require('../../../lib/template-compiler/compiler')

describe('platform diagnostic', () => {
  test('reports template errors with attribute location and code frame', () => {
    const errors = []
    parse('\n<view bindanimationstart="foo"></view>', {
      mode: 'ios',
      srcMode: 'wx',
      filePath: 'foo.mpx',
      ctorType: 'component',
      usingComponentsInfo: {},
      componentGenerics: {},
      warn: jest.fn(),
      error (msg, loc) {
        errors.push({ msg, loc })
      }
    })

    expect(errors[0].loc).toBe('foo.mpx:2:6')
    expect(errors[0].msg).not.toContain('foo.mpx:2:6')
    expect(errors[0].msg).toContain('Target: <view bindanimationstart="foo">')
    expect(errors[0].msg).toContain('React native environment does not support [animationstart] event!')
    expect(errors[0].msg).toContain('> 2 | <view bindanimationstart="foo"></view>')
  })

  test('reports style errors with sourcemap original location', () => {
    const errors = []
    const generator = new SourceMapGenerator({ file: 'generated.css' })
    generator.addMapping({
      generated: {
        line: 1,
        column: 8
      },
      original: {
        line: 4,
        column: 2
      },
      source: 'src/foo.styl'
    })
    generator.setSourceContent('src/foo.styl', '\n\n.text\n  letter-spacing normal\n')

    getClassMap({
      styles: [{
        content: '.text { letter-spacing: normal; }',
        map: generator.toJSON(),
        filename: 'generated.css'
      }],
      filename: 'generated.css',
      mode: 'ios',
      srcMode: 'wx',
      ctorType: 'component',
      formatValueName: '_f',
      warn: jest.fn(),
      error (msg, loc) {
        errors.push({ msg, loc })
      }
    })

    expect(errors[0].loc).toBe('src/foo.styl:4:3')
    expect(errors[0].msg).not.toContain('src/foo.styl:4:3')
    expect(errors[0].msg).toContain('Target: letter-spacing: normal')
    expect(errors[0].msg).not.toContain('Generated position')
    expect(errors[0].msg).not.toContain('Rule:')
    expect(errors[0].msg).toContain('> 4 |   letter-spacing normal')
  })

  test('reports json errors with key path', () => {
    const errors = []
    const rulesRunner = getRulesRunner({
      mode: 'ali',
      srcMode: 'wx',
      type: 'json',
      mainKey: 'component',
      waterfall: true,
      warn: jest.fn(),
      error: msg => errors.push(msg),
      diagnostic: {
        file: 'foo.json'
      }
    })

    rulesRunner({
      componentGenerics: {
        list: {}
      }
    })

    expect(errors[0]).toContain('Ali environment componentGenerics need to specify')
    expect(errors[0]).toContain('Target: componentGenerics.list: {}')
    expect(errors[0]).not.toContain('Path:')
    expect(errors[0]).not.toContain('Rule:')
  })

  test('reports json delete path errors separately', () => {
    const errors = []
    const rulesRunner = getRulesRunner({
      mode: 'qq',
      srcMode: 'wx',
      type: 'json',
      waterfall: true,
      warn: jest.fn(),
      error: msg => errors.push(msg),
      diagnostic: {
        file: 'foo.json'
      }
    })

    rulesRunner({
      functionalPages: true,
      plugins: {
        foo: {}
      }
    })

    expect(errors).toHaveLength(2)
    expect(errors[0]).toContain('Target: functionalPages: true')
    expect(errors[1]).toContain('Target: plugins: {"foo":{}}')
  })

  test('reports diagnostics from a complete mpx file pipeline', async () => {
    const filePath = '/project/src/pages/index.mpx'
    const source = [
      '<json>',
      '{',
      '  "componentGenerics": {',
      '    "list": {}',
      '  }',
      '}',
      '</json>',
      '<style lang="stylus">',
      '.text',
      '  letter-spacing normal',
      '</style>',
      '<template>',
      '  <view bindanimationstart="onAnimation"></view>',
      '</template>'
    ].join('\n')
    const parts = parseComponent(source, {
      filePath,
      needMap: true,
      mode: 'wx',
      env: ''
    })

    const templateErrors = []
    parse(parts.template.content, {
      mode: 'ios',
      srcMode: 'wx',
      filePath,
      ctorType: 'component',
      usingComponentsInfo: {},
      componentGenerics: {},
      warn: jest.fn(),
      error (msg, loc) {
        templateErrors.push({ msg, loc })
      }
    })

    expect(templateErrors[0].loc).toBe(`${filePath}:13:8`)
    expect(templateErrors[0].msg).not.toContain(`${filePath}:13:8`)
    expect(templateErrors[0].msg).toContain('Target: <view bindanimationstart="onAnimation">')

    const renderer = stylus(parts.styles[0].content)
      .set('filename', filePath)
      .set('sourcemap', { inline: false, comment: false })
    const css = await new Promise((resolve, reject) => {
      renderer.render((err, css) => err ? reject(err) : resolve(css))
    })
    const styleMap = renderer.sourcemap
    styleMap.sources = [filePath]
    styleMap.sourcesContent = [source]

    const styleErrors = []
    getClassMap({
      styles: [{
        content: css,
        map: styleMap,
        filename: filePath
      }],
      filename: filePath,
      mode: 'ios',
      srcMode: 'wx',
      ctorType: 'component',
      formatValueName: '_f',
      warn: jest.fn(),
      error (msg, loc) {
        styleErrors.push({ msg, loc })
      }
    })

    expect(styleErrors[0].loc).toBe(`${filePath}:10:3`)
    expect(styleErrors[0].msg).not.toContain(`${filePath}:10:3`)
    expect(styleErrors[0].msg).toContain('Target: letter-spacing: normal')
    expect(styleErrors[0].msg).toContain('> 10 |   letter-spacing normal')

    const jsonErrors = []
    const rulesRunner = getRulesRunner({
      mode: 'ali',
      srcMode: 'wx',
      type: 'json',
      mainKey: 'component',
      waterfall: true,
      warn: jest.fn(),
      error: msg => jsonErrors.push(msg),
      diagnostic: {
        file: filePath
      }
    })

    rulesRunner(JSON.parse(parts.json.content))

    expect(jsonErrors[0]).toContain('Ali environment componentGenerics need to specify')
    expect(jsonErrors[0]).toContain('Target: componentGenerics.list: {}')
  })
})
