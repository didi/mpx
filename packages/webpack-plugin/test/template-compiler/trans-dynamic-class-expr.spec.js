const compiler = require('../../lib/template-compiler/compiler')
const transDynamicClassExpr = require('../../lib/template-compiler/trans-dynamic-class-expr')

describe('dynamic class expression transform', () => {
  test('only escapes spaces and dashes in object keys', () => {
    const error = jest.fn()
    const result = transDynamicClassExpr("({ active: flag, 'foo-bar baz': flag })", { error })

    expect(result).toBe('{active:flag,foo_da_bar_sp_bazMpxEscape:flag}')
    expect(error).not.toHaveBeenCalled()
  })

  test('reports object keys that can not become valid identifiers', () => {
    const error = jest.fn()
    const result = transDynamicClassExpr("({ 'hover:bg-red-100': flag, 'foo$bar': flag, 'custom@red': flag, 'foo*bar': flag, 1: flag })", { error })

    expect(result).toContain("'hover:bg-red-100':flag")
    expect(result).toContain('foo$bar:flag')
    expect(result).toContain("'custom@red':flag")
    expect(result).toContain("'foo*bar':flag")
    expect(result).toContain('1:flag')
    expect(error).toHaveBeenCalledTimes(4)
  })

  test('skips dynamic class expression transform for files matching UnoCSS scan', () => {
    const errors = []
    const parsed = compiler.parse('<view wx:class="{{ { \'foo-bar\': flag, \'hover:bg-red-100\': flag } }}" />', {
      mode: 'wx',
      srcMode: 'wx',
      defs: {},
      usingComponentsInfo: {},
      externalClasses: [],
      isUnoCSSScanFile: true,
      warn: jest.fn(),
      error: error => errors.push(error)
    })
    const output = compiler.serialize(parsed.root)

    expect(output).toContain('"foo-bar": flag')
    expect(output).toMatch(/"hover:bg-red-100":\s*flag/)
    expect(errors).toEqual([])
  })

  test('transforms dynamic class expressions for files not matching UnoCSS scan', () => {
    const errors = []
    const parsed = compiler.parse('<view wx:class="{{ { \'hover:bg-red-100\': flag } }}" />', {
      mode: 'wx',
      srcMode: 'wx',
      defs: {},
      usingComponentsInfo: {},
      externalClasses: [],
      isUnoCSSScanFile: false,
      warn: jest.fn(),
      error: error => errors.push(error)
    })
    const output = compiler.serialize(parsed.root)

    expect(output).toMatch(/"hover:bg-red-100":\s*flag/)
    expect(errors).toHaveLength(1)
  })
})
