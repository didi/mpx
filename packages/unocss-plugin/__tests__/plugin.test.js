import MpxUnocssPlugin from '../lib/index.js'
import { getRawSource } from '../lib/source.js'
import { createGenerator, e as cssEscape } from '@unocss/core'
import { mpEscape } from '../lib/transform.js'
import presetMpx from '@mpxjs/unocss-base/lib/index.js'

// const { presetLegacyCompat } = require('@unocss/preset-legacy-compat')

// import testpage from './123.mpx?resolve'
describe('test plugin', () => {
  const mode = 'wx'
  const plugin = new MpxUnocssPlugin({
    config: {
      presets: [
        presetMpx()
      ]
    }
  })
  const mockCompilation = {
    fileDependencies: new Set()
  }
  let uno
  let parseTemplate

  beforeAll(async () => {
    uno = await plugin.createContext(mockCompilation, mode)
    parseTemplate = plugin.getTemplateParser(uno)
  })

  async function createReactGenerator () {
    const generator = await createGenerator({ presets: [presetMpx()] })
    generator.config.blocklist = generator.config.blocklist.map(item => typeof item === 'function' ? item.bind(generator) : item)
    return generator
  }

  async function testTemplate (content, generateOptions = {
    preflights: false,
    safelist: false
  }) {
    const source = getRawSource(content)
    const classmap = {}
    const { newsource } = parseTemplate(source, (className) => {
      if (!className) {
        return className
      }
      classmap[className] = true
      return mpEscape(cssEscape(className), plugin.options.escapeMap)
    })
    // 测试模板是否转义
    expect(newsource.source()).toMatchSnapshot()
    const classList = Object.keys(classmap)
    // 测试类名是否正确识别
    expect(classList).toMatchSnapshot()
    const unoFileContent = await plugin.generateStyle(uno, classList, generateOptions)
    // 测试css输出是否正确
    expect(unoFileContent).toMatchSnapshot()
  }
  test('test-template', async () => {
    await testTemplate('<view class="translate-[-50%,-50%] text-12px bg-#fff/10" />')
    await testTemplate('<view wx:class="{{[\'translate-[-50%]\',{\'text-12px text-16px\': false},\'bg-#fff/10\']}}" />')
  })

  test('supports box sizing utilities in react native mode', async () => {
    const targetMode = process.env.MPX_CURRENT_TARGET_MODE
    process.env.MPX_CURRENT_TARGET_MODE = 'ios'

    try {
      const uno = await createReactGenerator()
      const result = await uno.generate(['box-border', 'box-content'], { preflights: false })

      expect(result.css).toContain('.box-border{box-sizing:border-box;}')
      expect(result.css).toContain('.box-content{box-sizing:content-box;}')
      expect(uno.blocked).not.toContain('box-content')
    } finally {
      if (targetMode === undefined) {
        delete process.env.MPX_CURRENT_TARGET_MODE
      } else {
        process.env.MPX_CURRENT_TARGET_MODE = targetMode
      }
    }
  })

  test('supports transition utilities in react native mode', async () => {
    const targetMode = process.env.MPX_CURRENT_TARGET_MODE
    process.env.MPX_CURRENT_TARGET_MODE = 'ios'

    try {
      const uno = await createReactGenerator()
      const result = await uno.generate(['transition-opacity', 'duration-300', 'ease-in-out', 'delay-150', 'transition', 'transition-1', 'transition-all', 'transition-all-1', 'transition-all-foo', 'transition-colors', 'transition-[opacity,transform]'], { preflights: false })

      expect(result.css).toContain('transition-property:opacity;')
      expect(result.css).toContain('transition-duration:300ms;')
      expect(result.css).toContain('transition-timing-function:cubic-bezier(0.4, 0, 0.2, 1);')
      expect(result.css).toContain('transition-delay:150ms;')
      expect(result.css).toContain('transition-property:color,background-color,border-color,text-decoration-color,fill,stroke;')
      expect(result.css).toContain('transition-property:opacity,transform;')
      expect([...uno.blocked]).toEqual(expect.arrayContaining(['transition', 'transition-1', 'transition-all', 'transition-all-1']))
      expect([...uno.blocked]).toEqual(expect.not.arrayContaining(['transition-all-foo', 'transition-opacity', 'duration-300', 'ease-in-out', 'delay-150', 'transition-colors', 'transition-[opacity,transform]']))
    } finally {
      if (targetMode === undefined) {
        delete process.env.MPX_CURRENT_TARGET_MODE
      } else {
        process.env.MPX_CURRENT_TARGET_MODE = targetMode
      }
    }
  })
})
