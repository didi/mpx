const { compileAndParse, warnFn, errorFn } = require('../util')

describe('custom rule spec case', function () {
  afterEach(() => {
    warnFn.mockClear()
    errorFn.mockClear()
  })

  const baseCustomTransSpec = {
    template: {
      wx: {
        rules: [
          {
            test: 'view',
            swan (el, data) {
              el.tag = 'swan-view'
              return el
            }
          }
        ]
      }
    }
  }

  it('should trans as custom rules expected', function () {
    const rs = compileAndParse(`<view>123</view>`, { srcMode: 'wx', mode: 'swan', customTransSpec: baseCustomTransSpec })
    expect(rs).toBe('<swan-view>123</swan-view>')
  })

  it('should trans normal for web platform', function () {
    // web的处理是waterfall模式，命中一条规则后还会继续匹配
    const rs = compileAndParse(`<view bindtap="handleClick">123</view>`, { srcMode: 'wx', mode: 'web', customTransSpec: baseCustomTransSpec })
    expect(rs).toBe('<mpx-view @tap="handleClick">123</mpx-view>')
  })

  it('should trans normal for ali platform if custom trans rules only for swan', function () {
    const rs = compileAndParse(`<view bindtransitionend="handleClick">123</view>`, { srcMode: 'wx', mode: 'ali', customTransSpec: baseCustomTransSpec })
    expect(rs).toBe('<view onTransitionEnd="handleClick">123</view>')
  })
})
