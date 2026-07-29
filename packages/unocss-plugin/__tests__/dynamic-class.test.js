import { jest } from '@jest/globals'
import compiler from '@mpxjs/webpack-plugin/lib/template-compiler/compiler.js'
import { createGenerator } from '@unocss/core'
import MpxUnocssPlugin from '../lib/index.js'
import { parseClassExpression } from '../lib/parser.js'
import { getRawSource } from '../lib/source.js'

describe('dynamic class object keys', () => {
  const plugin = new MpxUnocssPlugin({ config: {} })

  async function transformTemplate (content, errors, rules = []) {
    const uno = await createGenerator({ rules })
    const parseTemplate = plugin.getTemplateParser(uno)
    const classes = []
    const { newsource, unknownClassChars } = parseTemplate(getRawSource(content), (className) => {
      if (className) classes.push(className)
      return className
    }, (error, loc) => errors.push({ error, loc }))
    const { matched } = await uno.generate(new Set(classes))
    unknownClassChars.forEach(({ value, loc }, className) => {
      if (matched.has(className)) return
      value.forEach((char) => {
        errors.push({
          error: `Classname [${className}] contains unsupported character [${char}].`,
          loc: Object.assign({ className }, loc)
        })
      })
    })
    return {
      output: newsource.source(),
      classes,
      matched
    }
  }

  test('parses strings and nested non-computed object keys by syntax', () => {
    const result = parseClassExpression("({ \"foo'bar\": flag, [dynamic]: 'computed', nested: { 'hover:bg-red-100': flag }, active: flag ? 'text-red-500' : \"text-gray-500\" })")

    expect(result.objectKeys.map(key => key.result)).toEqual(["foo'bar", 'nested', 'hover:bg-red-100', 'active'])
    expect(result.strings.map(string => string.result)).toEqual(['computed', 'text-red-500', 'text-gray-500'])
  })

  test('uses the same escaping for static and dynamic class names', async () => {
    const templateErrors = []
    const pluginErrors = []
    const parsed = compiler.parse('<view class="text-24rpx hover:bg-blue-100" wx:class="{{ { \'hover:bg-red-100\': flag } }}" />', {
      mode: 'wx',
      srcMode: 'wx',
      defs: {},
      usingComponentsInfo: {},
      externalClasses: [],
      hasUnoCSS: true,
      warn: jest.fn(),
      error: error => templateErrors.push(error)
    })
    const { output, classes } = await transformTemplate(compiler.serialize(parsed.root), pluginErrors)

    expect(templateErrors).toEqual([])
    expect(pluginErrors).toEqual([])
    expect(plugin.options).not.toHaveProperty('escapeMap')
    expect(classes).toEqual(expect.arrayContaining(['text-24rpx', 'hover:bg-blue-100', 'hover:bg-red-100']))
    expect(output).toContain('"text-24rpx hover_c_bg-blue-100"')
    expect(output).toMatch(/hover_c_bg_da_red_da_100MpxEscape:\s*flag/)
  })

  test('allows configured classes containing special characters', async () => {
    const errors = []
    const { output, matched } = await transformTemplate(
      '<view class="custom@blue" wx:class="{{ { \'custom@red\': flag } }}" />',
      errors,
      [
        [/^custom@(red|blue)$/, () => ({ color: 'red' })]
      ]
    )

    expect(output).toContain('class="custom_u_blue"')
    expect(output).toMatch(/custom_u_red:\s*flag/)
    expect(matched).toEqual(new Set(['custom@blue', 'custom@red']))
    expect(errors).toEqual([])
  })

  test('reports unhandled static class names containing unsupported characters', async () => {
    const errors = []
    const { output } = await transformTemplate('<view class="qwe@da *asd" />', errors)

    expect(output).toContain('class="qwe_u_da _u_asd"')
    expect(errors).toEqual([
      {
        error: 'Classname [qwe@da] contains unsupported character [@].',
        loc: {
          className: 'qwe@da',
          start: 13,
          end: 23
        }
      },
      {
        error: 'Classname [*asd] contains unsupported character [*].',
        loc: {
          className: '*asd',
          start: 13,
          end: 23
        }
      }
    ])
  })

  test('reports class object keys that can not become valid identifiers', async () => {
    const errors = []
    const { output } = await transformTemplate('<view wx:class="{{ { \'custom😀red\': flag, 12: flag } }}" />', errors)

    expect(output).toContain("'custom😀red': flag")
    expect(errors).toEqual([
      {
        error: 'Dynamic classname [custom😀red] can not be escaped as a valid identifier, which is not supported.',
        loc: {
          className: 'custom😀red',
          objectKey: true,
          start: 16,
          end: 54
        }
      },
      {
        error: 'Dynamic classname [12] can not be escaped as a valid identifier, which is not supported.',
        loc: {
          className: '12',
          objectKey: true,
          start: 16,
          end: 54
        }
      }
    ])
  })
})
