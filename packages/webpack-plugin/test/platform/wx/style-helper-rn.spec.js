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
