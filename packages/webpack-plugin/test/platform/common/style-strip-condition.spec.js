const { stripCondition, stripConditionForMpx, hasConditionalDirective } = require('../../../lib/style-compiler/strip-conditional')

describe('strip-conditional unit tests', () => {
  describe('stripCondition logic', () => {
    const defs = {
      platform: 'wx',
      theme: 'dark',
      version: 2
    }

    describe('CSS Block Comments /* ... */', () => {
      it('should keep content when condition is true', () => {
        const input = `
          /* @mpx-if (platform === 'wx') */
          .wx-style { color: red; }
          /* @mpx-endif */
        `
        const result = stripCondition(input, defs)
        expect(result).toContain('.wx-style { color: red; }')
      })

      it('should remove content when condition is false', () => {
        const input = `
          /* @mpx-if (platform === 'ali') */
          .ali-style { color: blue; }
          /* @mpx-endif */
        `
        const result = stripCondition(input, defs)
        expect(result.trim()).toBe('')
      })

      it('should support elif and else', () => {
        const input = `
          /* @mpx-if (platform === 'ali') */
          .ali { color: blue; }
          /* @mpx-elif (platform === 'wx') */
          .wx { color: red; }
          /* @mpx-else */
          .other { color: black; }
          /* @mpx-endif */
        `
        const result = stripCondition(input, defs)
        expect(result).not.toContain('.ali { color: blue; }')
        expect(result).toContain('.wx { color: red; }')
        expect(result).not.toContain('.other { color: black; }')
      })
    })

    describe('Line Comments // ...', () => {
      it('should work with line comments', () => {
        const input = `
          // @mpx-if (theme === 'dark')
          .dark-mode { background: #000; }
          // @mpx-endif
        `
        const result = stripCondition(input, defs)
        expect(result).toContain('.dark-mode { background: #000; }')
      })

      it('should handle false condition with line comments', () => {
        const input = `
          // @mpx-if (theme === 'light')
          .light-mode { background: #fff; }
          // @mpx-endif
        `
        const result = stripCondition(input, defs)
        expect(result.trim()).toBe('')
      })
    })

    describe('HTML Comments <!-- ... -->', () => {
      it('should work with HTML comments', () => {
        const input = `
          <!-- @mpx-if (platform === 'wx') -->
          <view class="wx">WeChat</view>
          <!-- @mpx-endif -->
        `
        const result = stripCondition(input, defs)
        expect(result).toContain('<view class="wx">WeChat</view>')
      })

      it('should support multiline conditions in HTML comments', () => {
        const input = `
          <!-- @mpx-if (
            platform === 'wx' &&
            version > 1
          ) -->
          <view>Multiline Condition</view>
          <!-- @mpx-endif -->
        `
        const result = stripCondition(input, defs)
        expect(result).toContain('<view>Multiline Condition</view>')
      })

      it('should support elif/else in HTML comments', () => {
        const input = `
          <!-- @mpx-if (platform === 'ali') -->
          <view>Ali</view>
          <!-- @mpx-elif (platform === 'wx') -->
          <view>Wx</view>
          <!-- @mpx-else -->
          <view>Other</view>
          <!-- @mpx-endif -->
        `
        const result = stripCondition(input, defs)
        expect(result).not.toContain('<view>Ali</view>')
        expect(result).toContain('<view>Wx</view>')
        expect(result).not.toContain('<view>Other</view>')
      })
    })

    describe('Error Handling', () => {
      it('should throw error when mpx-if is not closed', () => {
        const input = `
          /* @mpx-if (platform === 'wx') */
          .wx { color: red; }
        `
        expect(() => stripCondition(input, defs)).toThrow('[Mpx strip conditional error]: mpx-if without a matching endif')
      })

      it('should throw error when mpx-elif without preceding if', () => {
        const input = `
          /* @mpx-elif (platform === 'wx') */
          .wx { color: red; }
          /* @mpx-endif */
        `
        expect(() => stripCondition(input, defs)).toThrow('[Mpx style error]: elif without a preceding if')
      })

      it('should throw error when mpx-else without preceding if', () => {
        const input = `
          /* @mpx-else */
          .other { color: blue; }
          /* @mpx-endif */
        `
        expect(() => stripCondition(input, defs)).toThrow('[Mpx style error]: else without a preceding if')
      })
    })

    describe('Nested Conditions', () => {
      it('should handle nested conditions', () => {
        const input = `
          /* @mpx-if (platform === 'wx') */
            .wx-outer { display: block; }
            /* @mpx-if (theme === 'dark') */
            .wx-dark { color: #333; }
            /* @mpx-endif */
            /* @mpx-if (theme === 'light') */
            .wx-light { color: #fff; }
            /* @mpx-endif */
          /* @mpx-endif */
        `
        const result = stripCondition(input, defs)
        expect(result).toContain('.wx-outer { display: block; }')
        expect(result).toContain('.wx-dark { color: #333; }')
        expect(result).not.toContain('.wx-light { color: #fff; }')
      })

      it('should handle nested conditions with mixed comment types', () => {
        const input = `
          <!-- @mpx-if (platform === 'wx') -->
            <view>
              // @mpx-if (theme === 'dark')
              <text>Dark Mode</text>
              // @mpx-endif
            </view>
          <!-- @mpx-endif -->
        `
        const result = stripCondition(input, defs)
        expect(result).toContain('<text>Dark Mode</text>')
      })
    })

    describe('Complex Conditions', () => {
      it('should evaluate logical operators', () => {
        const input = `
          /* @mpx-if (platform === 'wx' && version >= 2) */
          .modern-wx { opacity: 1; }
          /* @mpx-endif */
        `
        const result = stripCondition(input, defs)
        expect(result).toContain('.modern-wx { opacity: 1; }')
      })

      it('should evaluate logical OR', () => {
        const input = `
          /* @mpx-if (platform === 'ali' || theme === 'dark') */
          .hybrid { opacity: 0.5; }
          /* @mpx-endif */
        `
        const result = stripCondition(input, defs)
        expect(result).toContain('.hybrid { opacity: 0.5; }')
      })
    })

    describe('Edge Cases', () => {
      it('should handle text outside conditions', () => {
        const input = `
          .common { color: gray; }
          /* @mpx-if (platform === 'wx') */
          .wx { color: green; }
          /* @mpx-endif */
          .footer { margin: 0; }
        `
        const result = stripCondition(input, defs)
        expect(result).toContain('.common { color: gray; }')
        expect(result).toContain('.wx { color: green; }')
        expect(result).toContain('.footer { margin: 0; }')
      })

      it('should handle unknown variables in condition (treat as undefined/error handled)', () => {
        // The implementation catches errors and returns false for the condition usually
        // or logs error. Based on implementation: console.error and return false.
        const input = `
          /* @mpx-if (unknownVar === true) */
          .should-not-exist {}
          /* @mpx-endif */
        `
        // We expect it to not throw, but exclude the content
        const result = stripCondition(input, defs)
        expect(result.trim()).toBe('')
      })
    })
  })

  describe('hasConditionalDirective', () => {
    it('should detect block comment directives', () => {
      expect(hasConditionalDirective('/* @mpx-if (x) */ .a {} /* @mpx-endif */')).toBe(true)
    })

    it('should detect line comment directives', () => {
      expect(hasConditionalDirective('// @mpx-if (x)\n.a {}\n// @mpx-endif')).toBe(true)
    })

    it('should detect HTML comment directives', () => {
      expect(hasConditionalDirective('<!-- @mpx-if (x) --><view/><!-- @mpx-endif -->')).toBe(true)
    })

    it('should return false for content without directives', () => {
      expect(hasConditionalDirective('.container { color: red; }')).toBe(false)
      expect(hasConditionalDirective('<template><view></view></template>')).toBe(false)
    })
  })

  describe('stripConditionForMpx', () => {
    const defs = {
      __mpx_mode__: 'wx',
      platform: 'wx',
      theme: 'dark'
    }

    it('should only strip conditions inside <style> blocks', () => {
      const input = `<template>
  <view class="container">Hello</view>
</template>
<style>
/* @mpx-if (platform === 'wx') */
.wx-only { color: red; }
/* @mpx-endif */
/* @mpx-if (platform === 'ali') */
.ali-only { color: blue; }
/* @mpx-endif */
</style>`
      const result = stripConditionForMpx(input, defs)
      expect(result).toContain('<view class="container">Hello</view>')
      expect(result).toContain('.wx-only { color: red; }')
      expect(result).not.toContain('.ali-only { color: blue; }')
    })

    it('should handle multiple <style> blocks', () => {
      const input = `<template>
  <view>Test</view>
</template>
<style>
/* @mpx-if (platform === 'wx') */
.block1 { color: red; }
/* @mpx-endif */
</style>
<style lang="less">
/* @mpx-if (theme === 'dark') */
.block2 { background: #000; }
/* @mpx-endif */
/* @mpx-if (theme === 'light') */
.block3 { background: #fff; }
/* @mpx-endif */
</style>`
      const result = stripConditionForMpx(input, defs)
      expect(result).toContain('.block1 { color: red; }')
      expect(result).toContain('.block2 { background: #000; }')
      expect(result).not.toContain('.block3 { background: #fff; }')
    })

    it('should return original content and log error when conditional directive appears in <template> section', () => {
      const input = `<template>
  <!-- @mpx-if (platform === 'wx') -->
  <view>Wx Only</view>
  <!-- @mpx-endif -->
</template>
<style>
.container { color: red; }
</style>`
      const result = stripConditionForMpx(input, defs, '/test/app.mpx')
      expect(result).toBe(input)
    })

    it('should return original content and log error when conditional directive appears in <script> section', () => {
      const input = `<template>
  <view>Test</view>
</template>
<script>
// @mpx-if (platform === 'wx')
console.log('wx')
// @mpx-endif
</script>
<style>
.container { color: red; }
</style>`
      const result = stripConditionForMpx(input, defs, '/test/app.mpx')
      expect(result).toBe(input)
    })

    it('should return original content and log error when conditional directive appears after last </style>', () => {
      const input = `<style>
.a { color: red; }
</style>
/* @mpx-if (platform === 'wx') */
.orphan { color: green; }
/* @mpx-endif */`
      const result = stripConditionForMpx(input, defs, '/test/app.mpx')
      expect(result).toBe(input)
    })

    it('should preserve non-style content unchanged', () => {
      const input = `<template>
  <view class="box">{{message}}</view>
</template>
<script>
import { createComponent } from '@mpxjs/core'
createComponent({ data: { message: 'hi' } })
</script>
<style>
/* @mpx-if (platform === 'wx') */
.box { padding: 10px; }
/* @mpx-endif */
</style>`
      const result = stripConditionForMpx(input, defs)
      expect(result).toContain('<view class="box">{{message}}</view>')
      expect(result).toContain("import { createComponent } from '@mpxjs/core'")
      expect(result).toContain('.box { padding: 10px; }')
    })

    it('should work with .mpx file that has no <style> and no directives', () => {
      const input = `<template>
  <view>Hello</view>
</template>
<script>
console.log('test')
</script>`
      const result = stripConditionForMpx(input, defs)
      expect(result).toBe(input)
    })

    it('should handle style block with attributes correctly', () => {
      const input = `<template>
  <view>Test</view>
</template>
<style lang="stylus" scoped>
/* @mpx-if (platform === 'wx') */
.styled { font-size: 14px; }
/* @mpx-endif */
</style>`
      const result = stripConditionForMpx(input, defs)
      expect(result).toContain('.styled { font-size: 14px; }')
      expect(result).toContain('<style lang="stylus" scoped>')
    })
  })
})
