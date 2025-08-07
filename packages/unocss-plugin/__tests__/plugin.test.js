import MpxUnocssPlugin from '../lib/index'
import { describe, expect, test } from 'vitest'
import { getRawSource } from '../lib/source.js'
import { e as cssEscape } from '@unocss/core'
import { mpEscape } from '../lib/transform.js'
import presetMpx from '@mpxjs/unocss-base/lib/index'
// const { presetLegacyCompat } = require('@unocss/preset-legacy-compat')

// import testpage from './123.mpx?resolve'
describe('test plugin', async () => {
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
  const uno = await plugin.createContext(mockCompilation, mode)
  const parseTemplate = plugin.getTemplateParser(uno)
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
    const list = new Set(classList)
    const unoFileContent = await plugin.generateStyle(uno, classList, generateOptions)
    // 测试css输出是否正确
    expect(unoFileContent).toMatchSnapshot()
  }
  test('test-template', async () => {
    await testTemplate('<view class="translate-[-50%,-50%] text-12px bg-#fff/10" />')
    await testTemplate('<view wx:class="{{[\'translate-[-50%]\',{\'text-12px text-16px\': false},\'bg-#fff/10\']}}" />')
  })
})
