const compiler = require('../../../lib/template-compiler/compiler')

describe('template should transform correct', function () {
  it('should report error when no src attr on wxs tag in ali env', function () {
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
    compiler.serialize(ast)
    expect(errorFn).toHaveBeenCalledWith(`<wxs> should have 'src' attr in ali environment!`)
  })

  it('should transform normally in ali env', function () {
    const input = `<wxs module="m1" src="./test.wxs"></wxs>
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
    expect(compiler.serialize(ast)).toBe('<import-sjs name="m1" from="./test.wxs"></import-sjs> <view>123</view> ')
    expect(errorFn).not.toHaveBeenCalled()
  })
})
