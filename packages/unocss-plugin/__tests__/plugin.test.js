import MpxUnocssPlugin from '../lib/index'
import { describe, expect, test } from 'vitest'
import { getRawSource } from '../lib/source.js'
import {  e as cssEscape } from '@unocss/core'
import { mpEscape } from '../lib/transform.js'
import presetMpx from '@mpxjs/unocss-base'
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
  test('test-template', async () => {
    const source = getRawSource('<view class="translate-[-50%,-50%] text-12px" />')
    const classmap = {}
    const { newsource } = parseTemplate(source, (className) => {
      if (!className) {
        return className
      }
      classmap[className] = true
      return mpEscape(cssEscape(className), plugin.options.escapeMap)
    })
    expect(newsource.source()).toMatchSnapshot()
    const classList = Object.keys(classmap)
    expect(classList).toMatchSnapshot()

    const generateOptions = {
      preflights: false,
      safelist: false,
      minify: this.minify
    }
    const list = new Set(classList)
    const unoFileContent = await plugin.generateStyle(uno, classList, generateOptions)
    console.log('unoFileContent==', list, unoFileContent)
    expect(unoFileContent).toMatchSnapshot()
  })
})
