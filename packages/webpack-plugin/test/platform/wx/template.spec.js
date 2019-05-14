const compiler = require('../../../lib/template-compiler/compiler')

describe('template should transform correct', function () {
  it('should transform to alipay correctly', function () {
    const input = `<wxs>var a = 123</wxs>
<view>123</view>
    `

    const errorFn = jest.fn()

    const parsed = compiler.parse(input, {
      usingComponents: [],
      srcMode: 'wx',
      mode: 'ali',
      warn: console.log,
      error: errorFn
    })
    const ast = parsed.root
    console.log(compiler.serialize(ast))
    expect(errorFn).toHaveBeenCalledWith(`<wxs> should have 'src' attr in ali environment!`)
  })
})
