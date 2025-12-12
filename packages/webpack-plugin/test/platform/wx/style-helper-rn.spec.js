const { getClassMap } = require('../../../lib/react/style-helper')

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
      expect(config.error).toHaveBeenCalledWith(
        expect.stringContaining('letter-spacing')
      )
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
      expect(config.error).toHaveBeenCalledWith(
        expect.stringContaining('line-height')
      )
    })

    test('should keep valid CSS variable with numeric fallback', () => {
      const css = '.text { letter-spacing: var(--x, 2px); line-height: var(--y, 1.5); }'
      const config = createConfig()

      const result = getClassMap({
        content: css,
        filename: 'test.css',
        ...config
      })

      expect(result.text._default).toEqual({
        letterSpacing: '"var(--x, 2px)"',
        lineHeight: '"var(--y, 1.5)"'
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

      expect(result.text._default).toEqual({
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
      expect(config.error).toHaveBeenCalledWith(
        expect.stringContaining('letter-spacing')
      )
    })

    test('should keep nested CSS variables with valid fallback', () => {
      const css = '.text { letter-spacing: var(--x, var(--y, 2px)); }'
      const config = createConfig()

      const result = getClassMap({
        content: css,
        filename: 'test.css',
        ...config
      })

      expect(result.text._default).toEqual({
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

      expect(result.text._default).toEqual({
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
      expect(result.text._default).toEqual({
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
      expect(result.text._default).toEqual({
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

      expect(result.box._default).toHaveProperty('marginLeft')
      expect(config.error).not.toHaveBeenCalled()
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

      expect(result.text._default).toEqual({
        letterSpacing: '2'
      })
      expect(config.error).not.toHaveBeenCalled()
    })
  })
})
