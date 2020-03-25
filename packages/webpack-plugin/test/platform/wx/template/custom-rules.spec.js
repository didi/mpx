const { compileAndParse, warnFn, errorFn } = require('../util')

describe('custom rule spec case', function () {
  afterEach(() => {
    warnFn.mockClear()
    errorFn.mockClear()
  })

  it('should trans as custom rules expected', function () {
    const customTransSpec = {
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
    const rs = compileAndParse(`<view>123</view>`, { srcMode: 'wx', mode: 'swan', customTransSpec })
    expect(rs).toBe('<swan-view>123</swan-view>')
  })
})
