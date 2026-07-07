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
        borderStyle: '"none"',
        borderTopWidth: '3'
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

    test('should normalize text-decoration style and drop color on android', () => {
      const css = '.dec { text-decoration: underline dotted red; } .style { text-decoration-style: dashed; } .color { text-decoration-color: blue; }'
      const config = createConfig('android')

      const result = getClassMap({
        content: css,
        filename: 'test.css',
        ...config
      })

      expect(result.dec).toEqual({
        textDecorationLine: '"underline"',
        textDecorationStyle: '"solid"'
      })
      expect(result.style).toEqual({
        textDecorationStyle: '"solid"'
      })
      expect(result.color).toBeUndefined()
      expect(config.warn).toHaveBeenCalledTimes(4)
      expect(config.error).not.toHaveBeenCalled()
    })

    test('should normalize text-decoration style and drop color on harmony', () => {
      const css = '.dec { text-decoration: underline dotted red; } .style { text-decoration-style: dashed; } .color { text-decoration-color: blue; }'
      const config = createConfig('harmony')

      const result = getClassMap({
        content: css,
        filename: 'test.css',
        ...config
      })

      expect(result.dec).toEqual({
        textDecorationLine: '"underline"',
        textDecorationStyle: '"solid"'
      })
      expect(result.style).toEqual({
        textDecorationStyle: '"solid"'
      })
      expect(result.color).toBeUndefined()
      expect(config.warn).toHaveBeenCalledTimes(4)
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

    test('should fill border defaults when style slot is empty', () => {
      // CSS 规范缺省值补齐，none 清除语义保留到运行时统一处理：
      // - style 存在 → 补 borderWidth: 3（borderColor 由 RN 内置缺省承接，不补）
      // - styleProp 槽位缺省（如 border: 2px / border-top: red）→ 补 borderStyle: none
      const css = '.a { border: solid; } .b { border: 2px; } .c { border-top: red; }'
      const config = createConfig()

      const result = getClassMap({
        content: css,
        filename: 'test.css',
        ...config
      })

      expect(result.a).toEqual({ borderStyle: '"solid"', borderWidth: '3' })
      expect(result.b).toEqual({ borderWidth: '2', borderStyle: '"none"' })
      expect(result.c).toEqual({ borderColor: '"red"', borderTopWidth: '3', borderStyle: '"none"' })
      expect(config.warn).not.toHaveBeenCalled()
      expect(config.error).not.toHaveBeenCalled()
    })

    test('should preserve border none / 0 for runtime clearing', () => {
      const css = '.a { border: 1px none red; } .b { border-top: red none; } .c { border: none; } .d { border: 0; } .e { border-top: 0; }'
      const config = createConfig()

      const result = getClassMap({
        content: css,
        filename: 'test.css',
        ...config
      })

      // none 清除语义不在编译期折叠；保留 borderStyle: none 交给运行时统一处理
      expect(result.a).toEqual({ borderWidth: '1', borderStyle: '"none"', borderColor: '"red"' })
      expect(result.b).toEqual({ borderColor: '"red"', borderStyle: '"none"', borderTopWidth: '3' })
      expect(result.c).toEqual({ borderStyle: '"none"', borderWidth: '3' })
      expect(result.d).toEqual({ borderWidth: '0', borderStyle: '"none"' })
      expect(result.e).toEqual({ borderTopWidth: '0', borderStyle: '"none"' })
      expect(config.warn).not.toHaveBeenCalled()
      expect(config.error).not.toHaveBeenCalled()
    })

    test('should allow explicit border-style to override shorthand default none by declaration order', () => {
      const css = '.a { border: 1px red; border-style: dashed; } .b { border-style: dashed; border: 1px red; }'
      const config = createConfig()

      const result = getClassMap({
        content: css,
        filename: 'test.css',
        ...config
      })

      expect(result.a).toEqual({
        borderWidth: '1',
        borderColor: '"red"',
        borderStyle: '"dashed"'
      })
      expect(result.b).toEqual({
        borderStyle: '"none"',
        borderWidth: '1',
        borderColor: '"red"'
      })
      expect(config.warn).not.toHaveBeenCalled()
      expect(config.error).not.toHaveBeenCalled()
    })

    test('should let explicit border-style fill the slot left default by width-only border shorthand', () => {
      // border: 1px 仅占 width 槽，style 槽缺省补 borderStyle: none；
      // 后置的 border-style: solid 按声明顺序覆盖默认 none，最终保留 solid
      // 注：编译期不注入 boxSizing（boxSizing 兜底是运行时 transformBoxSizing 行为）
      const css = '.a { border: 1px; border-style: solid; }'
      const config = createConfig()

      const result = getClassMap({
        content: css,
        filename: 'test.css',
        ...config
      })

      expect(result.a).toEqual({
        borderWidth: '1',
        borderStyle: '"solid"'
      })
      expect(config.warn).not.toHaveBeenCalled()
      expect(config.error).not.toHaveBeenCalled()
    })

    test('should preserve zero with unit for runtime clearing', () => {
      // 带单位 0px / 0rpx 走公共展开链路：0px 占 width 槽，styleProp 缺省补 borderStyle: none
      const css = '.a { border: 0px; } .b { border: 0rpx; } .c { border-top: 0px; }'
      const config = createConfig()

      const result = getClassMap({
        content: css,
        filename: 'test.css',
        ...config
      })

      expect(result.a).toEqual({ borderWidth: '0', borderStyle: '"none"' })
      expect(result.b).toEqual({ borderWidth: "undefined(0, 'rpx')", borderStyle: '"none"' })
      expect(result.c).toEqual({ borderTopWidth: '0', borderStyle: '"none"' })
      expect(config.warn).not.toHaveBeenCalled()
      expect(config.error).not.toHaveBeenCalled()
    })

    test('should fill text-shadow color default to #000', () => {
      // CSS 规范 text-shadow-color 缺省 currentColor，RN 无该概念，约定为 #000 补齐
      // radius 由 RN 内置缺省（0）承接，不补
      const css = `
        .a { text-shadow: 1px 2px; }
        .b { text-shadow: 1px 2px 3px; }
        .c { text-shadow: red 1px 2px; }
      `
      const config = createConfig()

      const result = getClassMap({
        content: css,
        filename: 'test.css',
        ...config
      })

      expect(result.a).toEqual({
        textShadowOffset: { width: '1', height: '2' },
        textShadowColor: '"#000"'
      })
      expect(result.b).toEqual({
        textShadowOffset: { width: '1', height: '2' },
        textShadowRadius: '3',
        textShadowColor: '"#000"'
      })
      expect(result.c).toEqual({
        textShadowOffset: { width: '1', height: '2' },
        textShadowColor: '"red"'
      })
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

  describe('Extended shorthand', () => {
    test('should expand gap shorthand to rowGap / columnGap', () => {
      // CSS 2 槽位（row-gap / column-gap），单值复制行列；双值原样
      const css = '.a { gap: 20px; } .b { gap: 10px 20px; }'
      const config = createConfig()

      const result = getClassMap({ content: css, filename: 'test.css', ...config })

      expect(result.a).toEqual({ rowGap: '20', columnGap: '20' })
      expect(result.b).toEqual({ rowGap: '10', columnGap: '20' })
      expect(config.warn).not.toHaveBeenCalled()
      expect(config.error).not.toHaveBeenCalled()
    })

    test('should expand inset shorthand to four sides', () => {
      // RN 0.74+ 原生支持 inset 单值 DimensionValue，单值原样透传；多值仍展开到 top/right/bottom/left
      const css = '.a { inset: 0; } .b { inset: 10px 20px; } .c { inset: 1px 2px 3px 4px; }'
      const config = createConfig()

      const result = getClassMap({ content: css, filename: 'test.css', ...config })

      expect(result.a).toEqual({ inset: '0' })
      expect(result.b).toEqual({ top: '10', right: '20', bottom: '10', left: '20' })
      expect(result.c).toEqual({ top: '1', right: '2', bottom: '3', left: '4' })
      expect(config.warn).not.toHaveBeenCalled()
      expect(config.error).not.toHaveBeenCalled()
    })

    test('should expand outline shorthand with same defaults as border', () => {
      // outline 与 border 共享 formatBorder：
      // - 完整三槽位 → 原样展开
      // - 缺 outlineWidth → 由 ShorthandDefaultMap 补 BORDER_MEDIUM_WIDTH(3)
      // - 缺 outlineStyle → 补 outlineStyle: none，运行时统一清除
      const css = [
        '.a { outline: 1px solid red; }',
        '.b { outline: red solid 2px; }',
        '.c { outline: solid; }',
        '.d { outline: solid red; }',
        '.e { outline: 2px; }'
      ].join(' ')
      const config = createConfig()

      const result = getClassMap({ content: css, filename: 'test.css', ...config })

      expect(result.a).toEqual({
        outlineWidth: '1',
        outlineStyle: '"solid"',
        outlineColor: '"red"'
      })
      expect(result.b).toEqual({
        outlineColor: '"red"',
        outlineStyle: '"solid"',
        outlineWidth: '2'
      })
      // 缺 width → 补 BORDER_MEDIUM_WIDTH(3)
      expect(result.c).toEqual({ outlineStyle: '"solid"', outlineWidth: '3' })
      expect(result.d).toEqual({
        outlineStyle: '"solid"',
        outlineColor: '"red"',
        outlineWidth: '3'
      })
      // 缺 style → 补 outlineStyle: none
      expect(result.e).toEqual({ outlineWidth: '2', outlineStyle: '"none"' })
      expect(config.warn).not.toHaveBeenCalled()
      expect(config.error).not.toHaveBeenCalled()
    })

    test('should preserve border-style longhand none and var fallback for runtime', () => {
      const css = '.a { border-style: none; } .b { border-style: solid; } .c { border-style: double; } .d { border-style: var(--bs, none); }'
      const config = createConfig()

      const result = getClassMap({ content: css, filename: 'test.css', ...config })

      expect(result.a).toEqual({ borderStyle: '"none"' })
      // 非 none 值仍走通用 verification，按白名单校验
      expect(result.b).toEqual({ borderStyle: '"solid"' })
      // double 不在 border-style 白名单 → 整体丢弃
      expect(result.c).toBeUndefined()
      expect(result.d).toEqual({ borderStyle: '"var(--bs, none)"' })
      expect(config.error).toHaveBeenCalled()
    })

    test('should preserve outline none / 0 / mixed none for runtime clearing', () => {
      const css = [
        '.a { outline: none; }',
        '.b { outline: 0; }',
        '.c { outline: 1px none red; }',
        '.d { outline-style: none; }',
        '.e { outline-style: var(--os, none); }'
      ].join(' ')
      const config = createConfig()

      const result = getClassMap({ content: css, filename: 'test.css', ...config })

      expect(result.a).toEqual({ outlineStyle: '"none"', outlineWidth: '3' })
      expect(result.b).toEqual({ outlineWidth: '0', outlineStyle: '"none"' })
      expect(result.c).toEqual({ outlineWidth: '1', outlineStyle: '"none"', outlineColor: '"red"' })
      expect(result.d).toEqual({ outlineStyle: '"none"' })
      expect(result.e).toEqual({ outlineStyle: '"var(--os, none)"' })
      expect(config.warn).not.toHaveBeenCalled()
      expect(config.error).not.toHaveBeenCalled()
    })

    test('should keep outline-style longhand validation for non-none values', () => {
      // 非 none 值（solid / dotted / dashed）继续走 verification 校验白名单；不合法值应被拒
      const css = '.a { outline-style: solid; } .b { outline-style: double; }'
      const config = createConfig()

      const result = getClassMap({ content: css, filename: 'test.css', ...config })

      expect(result.a).toEqual({ outlineStyle: '"solid"' })
      // double 不在 outline-style 白名单 → 整体丢弃
      expect(result.b).toBeUndefined()
      expect(config.error).toHaveBeenCalled()
    })

    test('should expand font shorthand subset', () => {
      // 必填项 font-size / font-family；前导段顺序不敏感，识别 font-style / small-caps / font-weight；
      // line-height 数值按 formatLineHeight 转百分比；font-family 取首值、去引号
      const css = '.a { font: italic bold 16px/1.5 Arial; } .b { font: 28px PingFangSC-Regular; } .c { font: small-caps 16px Arial; }'
      const config = createConfig()

      const result = getClassMap({ content: css, filename: 'test.css', ...config })

      expect(result.a).toEqual({
        fontSize: '16',
        fontStyle: '"italic"',
        fontWeight: '"bold"',
        lineHeight: '"150%"',
        fontFamily: '"Arial"'
      })
      expect(result.b).toEqual({ fontSize: '28', fontFamily: '"PingFangSC-Regular"' })
      expect(result.c).toEqual({
        fontSize: '16',
        fontVariant: '"small-caps"',
        fontFamily: '"Arial"'
      })
      expect(config.warn).not.toHaveBeenCalled()
      expect(config.error).not.toHaveBeenCalled()
    })

    test('should expand font shorthand with spaced slash line-height', () => {
      const css = '.a { font: 16px / 1.5 Arial; }'
      const config = createConfig()

      const result = getClassMap({ content: css, filename: 'test.css', ...config })

      expect(result.a).toEqual({
        fontSize: '16',
        lineHeight: '"150%"',
        fontFamily: '"Arial"'
      })
      expect(config.warn).not.toHaveBeenCalled()
      expect(config.error).not.toHaveBeenCalled()
    })

    test('should disambiguate font-weight number from font-size in font shorthand', () => {
      // unit-less 数字（如 500）既匹配 length 又匹配 font-weight 白名单；
      // formatFont 必须先排除 font-weight，才能把 28px 识别为 font-size
      const css = '.a { font: small-caps 500 28px/40px "PingFangSC-Regular"; }'
      const config = createConfig()

      const result = getClassMap({ content: css, filename: 'test.css', ...config })

      expect(result.a).toEqual({
        fontSize: '28',
        fontVariant: '"small-caps"',
        fontWeight: '500',
        lineHeight: '40',
        fontFamily: '"PingFangSC-Regular"'
      })
      expect(config.warn).not.toHaveBeenCalled()
      expect(config.error).not.toHaveBeenCalled()
    })

    test('should error and drop whole font when required size/family missing', () => {
      // 缺必填项（size / family）→ 整体丢弃 + error；selector 内无其它合法属性时 result.x 不会被生成
      const css = '.a { font: 16px; } .b { font: italic Arial; }'
      const config = createConfig()

      const result = getClassMap({ content: css, filename: 'test.css', ...config })

      expect(result.a).toBeUndefined()
      expect(result.b).toBeUndefined()
      expect(config.error).toHaveBeenCalled()
    })

    test('should warn and ignore unsupported token but keep the rest of font', () => {
      // 含不支持 token（condensed=font-stretch），但 size/family 齐全 → 忽略该 token、保留其余，不整体丢弃
      const css = '.a { font: condensed 16px Arial; }'
      const config = createConfig()

      const result = getClassMap({ content: css, filename: 'test.css', ...config })

      expect(result.a).toEqual({ fontSize: '16', fontFamily: '"Arial"' })
      expect(config.warn).toHaveBeenCalled()
      expect(config.error).not.toHaveBeenCalled()
    })

    test('should keep single var() font as-is for runtime parsing', () => {
      const css = '.a { font: var(--my-font); }'
      const config = createConfig()

      const result = getClassMap({ content: css, filename: 'test.css', ...config })

      expect(result.a).toEqual({ font: '"var(--my-font)"' })
      expect(config.warn).not.toHaveBeenCalled()
      expect(config.error).not.toHaveBeenCalled()
    })
  })

  describe('font-variant multi-token', () => {
    // 整串枚举校验会误杀空格分隔的多 token；专用 formatter 拆 token 后逐个复用 verifyValues
    test('should keep single-token font-variant', () => {
      const css = '.a { font-variant: small-caps; }'
      const config = createConfig()

      const result = getClassMap({
        content: css,
        filename: 'test.css',
        ...config
      })

      expect(result.a).toEqual({
        fontVariant: '"small-caps"'
      })
      expect(config.warn).not.toHaveBeenCalled()
      expect(config.error).not.toHaveBeenCalled()
    })

    test('should keep multi-token font-variant (space separated)', () => {
      const css = '.a { font-variant: small-caps tabular-nums; } .b { font-variant: oldstyle-nums proportional-nums; }'
      const config = createConfig()

      const result = getClassMap({
        content: css,
        filename: 'test.css',
        ...config
      })

      // 输出保留 raw value，运行时由 RN processFontVariant 自行 split 为数组
      expect(result.a).toEqual({
        fontVariant: '"small-caps tabular-nums"'
      })
      expect(result.b).toEqual({
        fontVariant: '"oldstyle-nums proportional-nums"'
      })
      expect(config.warn).not.toHaveBeenCalled()
      expect(config.error).not.toHaveBeenCalled()
    })

    test('should drop font-variant when any token is invalid', () => {
      const css = '.a { font-variant: small-caps not-a-variant; }'
      const config = createConfig()

      const result = getClassMap({
        content: css,
        filename: 'test.css',
        ...config
      })

      // 任意 token 非法则整体丢弃（selector 内无其它合法属性时 result.a 不会被生成）
      expect(result.a?.fontVariant).toBeUndefined()
      expect(config.error).toHaveBeenCalled()
    })

    test('should keep font-variant with var() multi-token fallback', () => {
      // var() fallback 走 verifyValues 的枚举校验同一分支，多 token fallback 也应放行
      const css = '.a { font-variant: var(--fv, small-caps tabular-nums); }'
      const config = createConfig()

      const result = getClassMap({
        content: css,
        filename: 'test.css',
        ...config
      })

      expect(result.a).toEqual({
        fontVariant: '"var(--fv, small-caps tabular-nums)"'
      })
      expect(config.warn).not.toHaveBeenCalled()
      expect(config.error).not.toHaveBeenCalled()
    })
  })

  describe('Transform 3d unsupported axis', () => {
    test('should drop translate3d / scale3d z axis instead of emitting unsupported keys', () => {
      const css = '.a { transform: translate3d(1px, 2px, 3px) scale3d(2, 3, 4); }'
      const config = createConfig()

      const result = getClassMap({
        content: css,
        filename: 'test.css',
        ...config
      })

      expect(result.a).toEqual({
        transform: [
          { translateX: '1' },
          { translateY: '2' },
          { scaleX: '2' },
          { scaleY: '3' }
        ]
      })
      expect(config.warn).toHaveBeenCalledTimes(2)
      expect(config.error).not.toHaveBeenCalled()
    })
  })
})
