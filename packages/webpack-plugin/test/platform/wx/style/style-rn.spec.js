const { getClassMap } = require('../../../../lib/react/style-helper')

describe('React Native style validation for CSS variables', () => {
  const createConfig = (mode = 'ios') => ({
    mode,
    srcMode: 'wx',
    ctorType: 'component',
    warn: jest.fn(),
    error: jest.fn()
  })

  describe('CSS variable fallback validation', () => {
    test('should filter out letter-spacing with invalid "normal" fallback', () => {
      const css = '.text { letter-spacing: var(--x, normal); }'
      const config = createConfig()

      const result = getClassMap({
        content: css,
        filename: 'test.css',
        ...config
      })

      expect(result).toEqual({})
      expect(config.error.mock.calls[0][0]).toEqual(expect.stringContaining('letter-spacing'))
    })

    test('should filter out line-height with invalid "normal" fallback', () => {
      const css = '.text { line-height: var(--y, normal); }'
      const config = createConfig()

      const result = getClassMap({
        content: css,
        filename: 'test.css',
        ...config
      })

      expect(result).toEqual({})
      expect(config.error.mock.calls[0][0]).toEqual(expect.stringContaining('line-height'))
    })

    test('should keep valid CSS variable with numeric fallback', () => {
      const css = '.text { letter-spacing: var(--x, 2px); line-height: var(--y, 1.5); }'
      const config = createConfig()

      const result = getClassMap({
        content: css,
        filename: 'test.css',
        ...config
      })

      expect(result.text).toEqual({
        letterSpacing: '"var(--x, 2px)"',
        lineHeight: '"var(--y, 1.5)"'
      })
      expect(config.error).not.toHaveBeenCalled()
    })

    test('should keep CSS variable with 0 fallback (no compile-time folding)', () => {
      const css = '.text { letter-spacing: var(--x, 0); }'
      const config = createConfig()

      const result = getClassMap({
        content: css,
        filename: 'test.css',
        ...config
      })

      expect(result.text).toEqual({
        letterSpacing: '"var(--x, 0)"'
      })
      expect(config.error).not.toHaveBeenCalled()
    })

    test('should keep CSS custom property with var() fallback (do not validate as RN number)', () => {
      const css = '.btn { --dn-container-height: var(--dn-tag-height, auto); }'
      const config = createConfig()

      const result = getClassMap({
        content: css,
        filename: 'test.css',
        ...config
      })

      expect(result.btn).toEqual({
        '--dn-container-height': '"var(--dn-tag-height, auto)"'
      })
      expect(config.error).not.toHaveBeenCalled()
    })

    test('should keep CSS variable without fallback', () => {
      const css = '.text { letter-spacing: var(--x); line-height: var(--y); }'
      const config = createConfig()

      const result = getClassMap({
        content: css,
        filename: 'test.css',
        ...config
      })

      expect(result.text).toEqual({
        letterSpacing: '"var(--x)"',
        lineHeight: '"var(--y)"'
      })
      expect(config.error).not.toHaveBeenCalled()
    })

    test('should validate nested CSS variables recursively', () => {
      const css = '.text { letter-spacing: var(--x, var(--y, normal)); }'
      const config = createConfig()

      const result = getClassMap({
        content: css,
        filename: 'test.css',
        ...config
      })

      expect(result).toEqual({})
      expect(config.error.mock.calls[0][0]).toEqual(expect.stringContaining('letter-spacing'))
    })

    test('should keep nested CSS variables with valid fallback', () => {
      const css = '.text { letter-spacing: var(--x, var(--y, 2px)); }'
      const config = createConfig()

      const result = getClassMap({
        content: css,
        filename: 'test.css',
        ...config
      })

      expect(result.text).toEqual({
        letterSpacing: '"var(--x, var(--y, 2px))"'
      })
      expect(config.error).not.toHaveBeenCalled()
    })

    test('should handle deeply nested CSS variables without infinite recursion', () => {
      // 测试深度嵌套（但不超过限制）
      const css = '.text { letter-spacing: var(--a, var(--b, var(--c, var(--d, var(--e, 2px))))); }'
      const config = createConfig()

      const result = getClassMap({
        content: css,
        filename: 'test.css',
        ...config
      })

      expect(result.text).toEqual({
        letterSpacing: '"var(--a, var(--b, var(--c, var(--d, var(--e, 2px)))))"'
      })
      expect(config.error).not.toHaveBeenCalled()
    })

    test('should stop at max depth for extremely nested CSS variables', () => {
      // 测试超深嵌套（超过10层）
      let nestedVar = '2px'
      for (let i = 0; i < 15; i++) {
        nestedVar = `var(--x${i}, ${nestedVar})`
      }
      const css = `.text { letter-spacing: ${nestedVar}; }`
      const config = createConfig()

      // 不应该导致堆栈溢出，应该正常返回或报错
      expect(() => {
        getClassMap({
          content: css,
          filename: 'test.css',
          ...config
        })
      }).not.toThrow()
    })

    test('should handle self-referencing CSS variable without infinite loop', () => {
      // 测试循环引用的情况：var(--x, var(--x))
      // 注意：var(--x, var(--x)) 的 fallback 是 var(--x)，它们是不同的字符串
      // 所以这种情况下 fallback 链会终止（var(--x) 没有 fallback 返回 null）
      const css = '.text { letter-spacing: var(--x, var(--x)); }'
      const config = createConfig()

      // 不应该导致无限循环，应该正常返回
      const result = getClassMap({
        content: css,
        filename: 'test.css',
        ...config
      })

      // 由于 var(--x) 没有 fallback，整个表达式是合法的，应该保留
      expect(result.text).toEqual({
        letterSpacing: '"var(--x, var(--x))"'
      })
      expect(config.error).not.toHaveBeenCalled()
    })

    test('should handle complex nested CSS variables with different fallbacks', () => {
      // 测试复杂嵌套：var(--a, var(--b, var(--a, 2px)))
      // 虽然看起来像循环引用，但每个 var() 的完整字符串都不同
      // var(--a, var(--b, var(--a, 2px))) -> fallback: var(--b, var(--a, 2px))
      // var(--b, var(--a, 2px)) -> fallback: var(--a, 2px)
      // var(--a, 2px) -> fallback: 2px (有效)
      const css = '.text { letter-spacing: var(--a, var(--b, var(--a, 2px))); }'
      const config = createConfig()

      const result = getClassMap({
        content: css,
        filename: 'test.css',
        ...config
      })

      // 应该成功解析，因为最终 fallback 是有效的 2px
      expect(result.text).toEqual({
        letterSpacing: '"var(--a, var(--b, var(--a, 2px)))"'
      })
      expect(config.error).not.toHaveBeenCalled()
    })

    test('should work on both ios and android modes', () => {
      const css = '.text { letter-spacing: var(--x, normal); }'

      ;['ios', 'android', 'harmony'].forEach(mode => {
        const config = createConfig(mode)
        const result = getClassMap({
          content: css,
          filename: 'test.css',
          ...config
        })

        expect(result).toEqual({})
        expect(config.error).toHaveBeenCalled()
      })
    })
  })

  describe('Other number properties with CSS variables', () => {
    test('should keep margin with "auto" fallback', () => {
      const css = '.box { margin-left: var(--m, auto); }'
      const config = createConfig()

      const result = getClassMap({
        content: css,
        filename: 'test.css',
        ...config
      })

      expect(result.box).toHaveProperty('marginLeft')
      expect(config.error).not.toHaveBeenCalled()
    })
  })

  describe('Background shorthand', () => {
    test('should expand background-position and background-size from slash shorthand', () => {
      const css = '.bg { background: url(https://example.com/bg.png) no-repeat center/cover #fff; }'
      const config = createConfig()

      const result = getClassMap({
        content: css,
        filename: 'test.css',
        ...config
      })

      expect(result.bg).toEqual({
        backgroundImage: '"url(https://example.com/bg.png)"',
        backgroundRepeat: '"no-repeat"',
        backgroundColor: '"#fff"',
        backgroundPosition: ['"50%"'],
        backgroundSize: ['"cover"']
      })
      expect(config.warn).not.toHaveBeenCalled()
      expect(config.error).not.toHaveBeenCalled()
    })

    test('should expand background-position and background-size with spaced slash', () => {
      const css = '.bg { background: url(bg.png) no-repeat left top / 100% 50%; }'
      const config = createConfig()

      const result = getClassMap({
        content: css,
        filename: 'test.css',
        ...config
      })

      expect(result.bg).toEqual({
        backgroundImage: '"url(bg.png)"',
        backgroundRepeat: '"no-repeat"',
        backgroundPosition: ['"left"', '"top"'],
        backgroundSize: ['"100%"', '"50%"']
      })
      expect(config.warn).not.toHaveBeenCalled()
      expect(config.error).not.toHaveBeenCalled()
    })

    describe('background-position [x, y] ordering', () => {
      const positionCases = [
        { input: 'top left', expected: ['"left"', '"top"'], desc: 'top left → [left, top]' },
        { input: 'bottom right', expected: ['"right"', '"bottom"'], desc: 'bottom right → [right, bottom]' },
        { input: 'left top', expected: ['"left"', '"top"'], desc: 'left top → [left, top] (already correct)' },
        { input: 'top center', expected: ['"50%"', '"top"'], desc: 'top center → [50%, top]' },
        { input: '50% 30%', expected: ['"50%"', '"30%"'], desc: '50% 30% → [50%, 30%] (no change)' }
      ]

      positionCases.forEach(({ input, expected, desc }) => {
        test(desc, () => {
          const css = `.bg { background-position: ${input}; }`
          const config = createConfig()
          const result = getClassMap({ content: css, filename: 'test.css', ...config })
          expect(result.bg).toEqual({ backgroundPosition: expected })
          expect(config.error).not.toHaveBeenCalled()
        })
      })
    })
  })

  describe('Unordered shorthand', () => {
    test('should expand unordered border shorthand', () => {
      const css = '.box { border: red solid 1px; }'
      const config = createConfig()

      const result = getClassMap({
        content: css,
        filename: 'test.css',
        ...config
      })

      expect(result.box).toEqual({
        borderColor: '"red"',
        borderStyle: '"solid"',
        borderWidth: '1'
      })
      expect(config.warn).not.toHaveBeenCalled()
      expect(config.error).not.toHaveBeenCalled()
    })

    test('should expand unordered side border shorthand', () => {
      const css = '.top { border-top: red solid 1px; } .left { border-left: dashed 2px blue; } .none { border-top: none; }'
      const config = createConfig()

      const result = getClassMap({
        content: css,
        filename: 'test.css',
        ...config
      })

      // RN 不支持单边 border-*-style，shorthand 中的 style 槽位统一展开到 borderStyle；
      // 又因 RN 上单边 border-*-color 在非 solid 风格下不生效，单边 color 也统一展开到 borderColor
      expect(result.top).toEqual({
        borderColor: '"red"',
        borderStyle: '"solid"',
        borderTopWidth: '1'
      })
      expect(result.left).toEqual({
        borderStyle: '"dashed"',
        borderLeftWidth: '2',
        borderColor: '"blue"'
      })
      expect(result.none).toEqual({
        borderTopWidth: '0'
      })
      expect(config.warn).not.toHaveBeenCalled()
      expect(config.error).not.toHaveBeenCalled()
    })

    test('should expand unordered text-decoration shorthand', () => {
      const css = '.dec { text-decoration: red underline solid; } .multi { text-decoration: underline line-through red; }'
      const config = createConfig()

      const result = getClassMap({
        content: css,
        filename: 'test.css',
        ...config
      })

      expect(result.dec).toEqual({
        textDecorationColor: '"red"',
        textDecorationStyle: '"solid"',
        textDecorationLine: '"underline"'
      })
      expect(result.multi).toEqual({
        textDecorationColor: '"red"',
        textDecorationLine: '"underline line-through"'
      })
      expect(config.warn).not.toHaveBeenCalled()
      expect(config.error).not.toHaveBeenCalled()
    })

    test('should expand unordered flex-flow and text-shadow shorthand', () => {
      const css = '.flow { flex-flow: wrap row; } .shadow { text-shadow: red 1px 2px 3px; } .shadow2 { text-shadow: 1px 2px red; }'
      const config = createConfig()

      const result = getClassMap({
        content: css,
        filename: 'test.css',
        ...config
      })

      expect(result.flow).toEqual({
        flexWrap: '"wrap"',
        flexDirection: '"row"'
      })
      expect(result.shadow).toEqual({
        textShadowColor: '"red"',
        textShadowOffset: {
          width: '1',
          height: '2'
        },
        textShadowRadius: '3'
      })
      expect(result.shadow2).toEqual({
        textShadowOffset: {
          width: '1',
          height: '2'
        },
        textShadowColor: '"red"'
      })
      expect(config.warn).not.toHaveBeenCalled()
      expect(config.error).not.toHaveBeenCalled()
    })

    test('should still expand ordered border shorthand (regression)', () => {
      const css = '.box { border: 1px solid red; }'
      const config = createConfig()

      const result = getClassMap({
        content: css,
        filename: 'test.css',
        ...config
      })

      expect(result.box).toEqual({
        borderWidth: '1',
        borderStyle: '"solid"',
        borderColor: '"red"'
      })
      expect(config.warn).not.toHaveBeenCalled()
      expect(config.error).not.toHaveBeenCalled()
    })

    test('should accept partial border shorthand without all three slots', () => {
      const css = '.a { border: solid; } .b { border: 2px; } .c { border-top: red; }'
      const config = createConfig()

      const result = getClassMap({
        content: css,
        filename: 'test.css',
        ...config
      })

      expect(result.a).toEqual({ borderStyle: '"solid"' })
      expect(result.b).toEqual({ borderWidth: '2' })
      expect(result.c).toEqual({ borderColor: '"red"' })
      expect(config.warn).not.toHaveBeenCalled()
      expect(config.error).not.toHaveBeenCalled()
    })

    test('should short-circuit to borderWidth: 0 when border shorthand contains none', () => {
      const css = '.a { border: 1px none red; } .b { border-top: red none; } .c { border: none; }'
      const config = createConfig()

      const result = getClassMap({
        content: css,
        filename: 'test.css',
        ...config
      })

      // CSS 规范中 border-style: none 等价于无边框，整体短路为 border*Width: 0
      expect(result.a).toEqual({ borderWidth: '0' })
      expect(result.b).toEqual({ borderTopWidth: '0' })
      expect(result.c).toEqual({ borderWidth: '0' })
      expect(config.warn).not.toHaveBeenCalled()
      expect(config.error).not.toHaveBeenCalled()
    })

    test('should warn on duplicate same-type tokens in border shorthand', () => {
      const css = '.box { border: 1px 2px solid red; }'
      const config = createConfig()

      const result = getClassMap({
        content: css,
        filename: 'test.css',
        ...config
      })

      // 第二个长度无法匹配未占用的属性，触发 invalid warn；其余三个槽位仍正常填充
      expect(result.box).toEqual({
        borderWidth: '1',
        borderStyle: '"solid"',
        borderColor: '"red"'
      })
      expect(config.warn).toHaveBeenCalled()
    })

    test('should fallback offset-y to 0 when text-shadow is missing the second length', () => {
      const css = '.s { text-shadow: red 2px; }'
      const config = createConfig()

      const result = getClassMap({
        content: css,
        filename: 'test.css',
        ...config
      })

      expect(result.s).toEqual({
        textShadowColor: '"red"',
        textShadowOffset: {
          width: '2',
          height: '0'
        }
      })
      expect(config.warn).toHaveBeenCalled()
    })

    test('should warn on unknown text-decoration line tokens instead of treating them as none', () => {
      const css = '.t { text-decoration: overline red; }'
      const config = createConfig()

      const result = getClassMap({
        content: css,
        filename: 'test.css',
        ...config
      })

      // overline 不是 RN 支持的 line 值，应走 invalid 路径，仅保留 color
      expect(result.t).toEqual({
        textDecorationColor: '"red"'
      })
      expect(config.warn).toHaveBeenCalled()
    })

    test('should keep single var() shorthand as-is for runtime parsing', () => {
      // 单个 var() 的简写在编译期无法判断内部 token 类型，原样保留交给运行时解析
      const css = `
        .border { border: var(--my-border); }
        .borderTop { border-top: var(--my-border-top); }
        .deco { text-decoration: var(--my-deco); }
        .shadow { text-shadow: var(--my-shadow); }
        .flow { flex-flow: var(--my-flow); }
      `
      const config = createConfig()

      const result = getClassMap({
        content: css,
        filename: 'test.css',
        ...config
      })

      expect(result.border).toEqual({ border: '"var(--my-border)"' })
      expect(result.borderTop).toEqual({ borderTop: '"var(--my-border-top)"' })
      expect(result.deco).toEqual({ textDecoration: '"var(--my-deco)"' })
      expect(result.shadow).toEqual({ textShadow: '"var(--my-shadow)"' })
      expect(result.flow).toEqual({ flexFlow: '"var(--my-flow)"' })
      expect(config.warn).not.toHaveBeenCalled()
      expect(config.error).not.toHaveBeenCalled()
    })

    test('should reject direct per-side border-style longhand', () => {
      // RN 双端都不支持 border-*-style 长属性，shorthand 仅在 border-* 简写中以 borderStyle 形式展开
      const css = '.t { border-top-style: solid; }'
      const config = createConfig()

      const result = getClassMap({
        content: css,
        filename: 'test.css',
        ...config
      })

      expect(result.t).toBeUndefined()
      expect(config.error).toHaveBeenCalled()
      expect(config.error.mock.calls[0][0]).toEqual(expect.stringContaining('border-top-style'))
    })
  })

  describe('Direct normal values (without CSS variables)', () => {
    test('should filter out direct letter-spacing: normal', () => {
      const css = '.text { letter-spacing: normal; }'
      const config = createConfig()

      const result = getClassMap({
        content: css,
        filename: 'test.css',
        ...config
      })

      expect(result).toEqual({})
      expect(config.error).toHaveBeenCalled()
    })

    test('should keep direct letter-spacing: 2px', () => {
      const css = '.text { letter-spacing: 2px; }'
      const config = createConfig()

      const result = getClassMap({
        content: css,
        filename: 'test.css',
        ...config
      })

      expect(result.text).toEqual({
        letterSpacing: '2'
      })
      expect(config.error).not.toHaveBeenCalled()
    })

    test('should filter out text-align: auto', () => {
      const css = '.text { text-align: auto; }'
      const config = createConfig()

      const result = getClassMap({
        content: css,
        filename: 'test.css',
        ...config
      })

      expect(result).toEqual({})
      expect(config.error.mock.calls[0][0]).toEqual(expect.stringContaining('text-align'))
    })

    test('should keep vertical-align: middle on android', () => {
      const css = '.text { vertical-align: middle; }'
      const config = createConfig('android')

      const result = getClassMap({
        content: css,
        filename: 'test.css',
        ...config
      })

      expect(result.text).toEqual({
        verticalAlign: '"middle"'
      })
      expect(config.error).not.toHaveBeenCalled()
    })

    test('should filter out unsupported float and clear', () => {
      const css = '.box { float: left; clear: both; }'
      const config = createConfig()

      const result = getClassMap({
        content: css,
        filename: 'test.css',
        ...config
      })

      expect(result).toEqual({})
      expect(config.error).toHaveBeenCalledTimes(2)
    })

    test('should keep explicit box-sizing values', () => {
      const css = '.content { box-sizing: content-box; } .border { box-sizing: border-box; }'
      const config = createConfig()

      const result = getClassMap({
        content: css,
        filename: 'test.css',
        ...config
      })

      expect(result.content).toEqual({
        boxSizing: '"content-box"'
      })
      expect(result.border).toEqual({
        boxSizing: '"border-box"'
      })
      expect(config.error).not.toHaveBeenCalled()
    })
  })
})
