const compiler = require('../../../lib/template-compiler/compiler')

const errorFn = jest.fn(console.error)
const warnFn = jest.fn(console.warn)

function compileAndParse (input) {
  const parsed = compiler.parse(input, {
    usingComponents: [],
    srcMode: 'wx',
    mode: 'ali',
    warn: warnFn,
    error: errorFn
  })
  const ast = parsed.root
  return compiler.serialize(ast)
}

describe('template should transform correct', function () {
  it('should transform normally in ali env', function () {
    const input = `<wxs module="m1" src="./test.wxs"></wxs>
<view>123</view>
    `

    expect(compileAndParse(input)).toBe('<import-sjs name="m1" from="./test.wxs"></import-sjs> <view>123</view> ')
    expect(errorFn).not.toHaveBeenCalled()
  })

  it('should warning if button\'s open-type is a variable', function () {
    const input = `<button open-type="{{ aaa }}" bindTap="handleClick"></button>`
    compileAndParse(input)
    expect(warnFn).toHaveBeenCalledWith(`<button>'s property 'open-type' does not support '[{{ aaa }}]' value in ali environment!`)
  })

  it('should not report error about transform if node removed', () => {
    const input = `
    <view>test</view>
    <live-pusher wx:if="{{__mpx_mode__ === 'wx'}}"></live-pusher>
    `
    compileAndParse(input)
    expect(errorFn).not.toHaveBeenCalled()

    const normalInput = `
    <map covers="123">test</map>
    `
    compileAndParse(normalInput)
    expect(warnFn).toHaveBeenCalled()
  })

  it('should not report error when parent node removed', () => {
    const input = `
    <view>test</view>
    <view wx:if="{{__mpx_mode__ === 'wx'}}">
        <live-pusher></live-pusher>
    </view>
    `
    compileAndParse(input)
    expect(errorFn).not.toHaveBeenCalled()
  })
})
