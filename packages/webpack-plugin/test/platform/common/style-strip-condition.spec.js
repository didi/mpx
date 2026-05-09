const postcss = require('postcss')
const stylus = require('stylus')
const { SourceMapConsumer } = require('source-map')
const { stripCondition } = require('../../../lib/style-compiler/strip-conditional')
const removeStripConditionalComments = require('../../../lib/style-compiler/plugins/remove-strip-conditional-comments')
const { parseComponent } = require('../../../lib/template-compiler/compiler')
const { STYLE_PAD_PLACEHOLDER } = require('../../../lib/utils/const')

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
        expect(result).not.toContain('.ali-style { color: blue; }')
        expect(result).toContain(STYLE_PAD_PLACEHOLDER)
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
        expect(result).not.toContain('.light-mode { background: #fff; }')
        expect(result).toContain(STYLE_PAD_PLACEHOLDER)
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
        expect(result).not.toContain('.should-not-exist {}')
        expect(result).toContain(STYLE_PAD_PLACEHOLDER)
      })

      it('should preserve original line count after stripping', () => {
        const input = [
          '.before { color: gray; }',
          '/* @mpx-if (platform === \'ali\') */',
          '.ali { color: blue; }',
          '/* @mpx-else */',
          '.wx { color: red; }',
          '/* @mpx-endif */',
          '.after { color: black; }'
        ].join('\n')
        const result = stripCondition(input, defs)
        expect(result.split('\n').length).toBe(input.split('\n').length)
        expect(result).not.toContain('.ali { color: blue; }')
        expect(result).toContain('.wx { color: red; }')
      })

      it('should preserve line positions for content after stripped branches', () => {
        const input = [
          '.before { color: gray; }',
          '/* @mpx-if (platform === \'ali\') */',
          '.ali { color: blue; }',
          '/* @mpx-endif */',
          '.after { color: black; }'
        ].join('\n')
        const result = stripCondition(input, defs)
        const getAfterLine = content => content.split('\n').findIndex(line => {
          return line.indexOf('.after') > -1
        })
        expect(getAfterLine(result)).toBe(getAfterLine(input))
      })

      it('should use removable comment placeholders without blank lines', () => {
        const input = [
          '.before',
          '  color gray',
          '  /* @mpx-if (platform === \'ali\') */',
          '  color blue',
          '  /* @mpx-endif */',
          '  color black'
        ].join('\n')
        const result = stripCondition(input, defs)
        expect(result.split('\n').length).toBe(input.split('\n').length)
        expect(result).not.toContain('color blue')
        expect(result).toContain(`  /* ${STYLE_PAD_PLACEHOLDER} */`)
        expect(result.split('\n').some(line => line === '')).toBe(false)
      })

      it('should remove placeholder comments in postcss output', async () => {
        const input = [
          `/* ${STYLE_PAD_PLACEHOLDER} */`,
          '.before { color: gray; }',
          `  /* ${STYLE_PAD_PLACEHOLDER} */`,
          '.after { color: black; }'
        ].join('\n')
        const result = await postcss([removeStripConditionalComments()]).process(input, { from: undefined })
        expect(result.css).not.toContain(STYLE_PAD_PLACEHOLDER)
        expect(result.css).toContain('.before { color: gray; }')
        expect(result.css).toContain('.after { color: black; }')
      })

      it('should pad style blocks with removable comments', () => {
        const input = [
          '<template>',
          '  <view />',
          '</template>',
          '<script>',
          'export default {}',
          '</script>',
          '<style lang="stylus">',
          '.after',
          '  color black',
          '</style>'
        ].join('\n')
        const result = parseComponent(input, { pad: 'line' })
        const lines = result.styles[0].content.split('\n')
        expect(lines[0]).toBe(`/* ${STYLE_PAD_PLACEHOLDER} */`)
        expect(lines[5]).toBe(`/* ${STYLE_PAD_PLACEHOLDER} */`)
        expect(lines[7]).toBe('.after')
      })
    })

    describe('end-to-end pipeline (strip-conditional → stylus → postcss → sourcemap)', () => {
      it('preserves source line positions through the full style pipeline', async () => {
        const filename = '/abs/source.styl'
        const src = [
          '.before',
          '  color gray',
          '/* @mpx-if (platform === \'ali\') */',
          '.ali',
          '  color blue',
          '/* @mpx-endif */',
          '.after',
          '  color black'
        ].join('\n')

        const stripped = stripCondition(src, defs)
        expect(stripped.split('\n').length).toBe(src.split('\n').length)

        const renderer = stylus(stripped)
          .set('filename', filename)
          .set('sourcemap', { inline: false, comment: false })
        const stylusCss = await new Promise((resolve, reject) => {
          renderer.render((err, css) => err ? reject(err) : resolve(css))
        })
        expect(stylusCss).toContain('.before')
        expect(stylusCss).toContain('.after')
        expect(stylusCss).not.toContain('.ali')
        expect(stylusCss).toContain(STYLE_PAD_PLACEHOLDER)

        const postResult = await postcss([removeStripConditionalComments()]).process(stylusCss, {
          from: filename,
          to: '/abs/source.css',
          map: { prev: renderer.sourcemap, inline: false, annotation: false }
        })
        expect(postResult.css).not.toContain(STYLE_PAD_PLACEHOLDER)
        expect(postResult.css).toContain('.before')
        expect(postResult.css).toContain('.after')

        const consumer = await new SourceMapConsumer(postResult.map.toJSON())
        const finalLines = postResult.css.split('\n')
        const findOutputLine = needle => finalLines.findIndex(l => l.indexOf(needle) > -1) + 1

        const beforeOrig = consumer.originalPositionFor({ line: findOutputLine('.before'), column: 0 })
        const afterOrig = consumer.originalPositionFor({ line: findOutputLine('.after'), column: 0 })
        expect(beforeOrig.line).toBe(1)
        expect(afterOrig.line).toBe(7)
      })
    })
  })
})
