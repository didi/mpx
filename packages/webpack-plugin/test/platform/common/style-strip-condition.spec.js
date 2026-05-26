const { stripCondition } = require('../../../lib/style-compiler/strip-conditional')

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
})
