const compiler = require('../../../lib/template-compiler/compiler')

describe('template should transform correct', function () {
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

  it('should warning if button\'s open-type is a variable', function () {
    const input = `<button open-type="{{ aaa }}" bindTap="handleClick"></button>`
    const errorFn = jest.fn(console.error)
    const warnFn = jest.fn(console.warn)

    const parsed = compiler.parse(input, {
      usingComponents: [],
      srcMode: 'wx',
      mode: 'ali',
      warn: warnFn,
      error: errorFn
    })
    const ast = parsed.root
    compiler.serialize(ast)
    expect(warnFn).toHaveBeenCalledWith(`<button>'s property 'open-type' does not support '[{{ aaa }}]' value in ali environment!`)
  })

  it('should not report error about transform if node removed', () => {
    const input = `
    <view>test</view>
    <live-pusher wx:if="{{__mpx_mode__ === 'wx'}}"></live-pusher>
    `
    const errorFn = jest.fn(console.error)
    const warnFn = jest.fn(console.warn)

    const parsed = compiler.parse(input, {
      usingComponents: [],
      srcMode: 'wx',
      mode: 'ali',
      warn: warnFn,
      error: errorFn
    })
    const ast = parsed.root
    compiler.serialize(ast)
    expect(errorFn).not.toHaveBeenCalled()

    const normalInput = `
    <map covers="123">test</map>
    `
    const normalParsed = compiler.parse(normalInput, {
      usingComponents: [],
      srcMode: 'wx',
      mode: 'ali',
      warn: warnFn,
      error: errorFn
    })
    const normalAst = normalParsed.root
    compiler.serialize(normalAst)
    expect(warnFn).toHaveBeenCalled()
  })
})
