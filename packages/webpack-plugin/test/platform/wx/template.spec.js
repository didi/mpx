const compiler = require('../../../lib/template-compiler/compiler')

const errorFn = jest.fn(console.error)
const warnFn = jest.fn(console.warn)

function compileAndParse (input, { srcMode, mode } = { srcMode: 'wx', mode: 'ali' }) {
  const parsed = compiler.parse(input, {
    usingComponents: [],
    srcMode,
    mode,
    warn: warnFn,
    error: errorFn
  })
  const ast = parsed.root
  return compiler.serialize(ast)
}

describe('template should transform correct', function () {
  afterEach(() => {
    warnFn.mockClear()
    errorFn.mockClear()
  })

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

  it('should optimize key of for in swan', function () {
    const input1 = `<view wx:for="{{list}}" wx:key="unique">123</view>`
    const input2 = `<view wx:for="{{list}}">123</view>`
    const input3 = `<view wx:for="{{list}}" wx:for-item="t1">123</view>`
    const input4 = `<view wx:for="{{list}}" wx:for-index="t1">123</view>`
    const input5 = `<view wx:for="{{list}}" wx:for-item="t1" wx:for-index="t2">123</view>`
    const input6 = `<view wx:for="{{list}}" wx:for-item="t1" wx:for-index="t2" wx:key="u1">123</view>`
    const input7 = `<view wx:for="strings" wx:for-item="t1" wx:for-index="t2" wx:key="u1">123</view>`
    const input8 = `<view wx:for="123" wx:for-item="t1" wx:for-index="t2" wx:key="u1">123</view>`
    const input9 = `<view wx:for="{{8}}" wx:for-item="t1" wx:for-index="t2" wx:key="u1">123</view>`
    const input10 = `<view wx:for="{{list}}" wx:key="*this">123</view>`
    const input11 = `<view wx:for="{{list}}" wx:key="a-b">123</view>`
    const input12 = `<view wx:for="{{list}}" wx:key="{{index}}">123</view>`
    const input13 = `<view wx:for="{{list}}" wx:key="{{prefix}}Hey">123</view>`
    const input14 = `<view wx:for="{{ 8 }}" wx:for-item="t1" wx:for-index="t2" wx:key="u1">123</view>`

    const output1 = compileAndParse(input1, { srcMode: 'wx', mode: 'swan' })
    const output2 = compileAndParse(input2, { srcMode: 'wx', mode: 'swan' })
    const output3 = compileAndParse(input3, { srcMode: 'wx', mode: 'swan' })
    const output4 = compileAndParse(input4, { srcMode: 'wx', mode: 'swan' })
    const output5 = compileAndParse(input5, { srcMode: 'wx', mode: 'swan' })
    const output6 = compileAndParse(input6, { srcMode: 'wx', mode: 'swan' })
    const output7 = compileAndParse(input7, { srcMode: 'wx', mode: 'swan' })
    const output8 = compileAndParse(input8, { srcMode: 'wx', mode: 'swan' })
    const output9 = compileAndParse(input9, { srcMode: 'wx', mode: 'swan' })
    const output10 = compileAndParse(input10, { srcMode: 'wx', mode: 'swan' })
    const output11 = compileAndParse(input11, { srcMode: 'wx', mode: 'swan' })
    const output12 = compileAndParse(input12, { srcMode: 'wx', mode: 'swan' })
    const output13 = compileAndParse(input13, { srcMode: 'wx', mode: 'swan' })
    const output14 = compileAndParse(input14, { srcMode: 'wx', mode: 'swan' })

    expect(output1).toBe('<view s-for="item, index in list trackBy item.unique">123</view>')
    expect(output2).toBe('<view s-for="item, index in list">123</view>')
    expect(output3).toBe('<view s-for="t1, index in list">123</view>')
    expect(output4).toBe('<view s-for="item, t1 in list">123</view>')
    expect(output5).toBe('<view s-for="t1, t2 in list">123</view>')
    expect(output6).toBe('<view s-for="t1, t2 in list trackBy t1.u1">123</view>')
    expect(output7).toBe(`<view s-for='t1, t2 in ["s","t","r","i","n","g","s"] trackBy t1'>123</view>`)
    expect(output8).toBe(`<view s-for='t1, t2 in ["1","2","3"] trackBy t1'>123</view>`)
    expect(output9).toBe('<view s-for="t1, t2 in [0,1,2,3,4,5,6,7] trackBy t1">123</view>')
    expect(output10).toBe('<view s-for="item, index in list trackBy item">123</view>')
    expect(output11).toBe(`<view s-for="item, index in list trackBy item['a-b']">123</view>`)
    expect(output12).toBe(`<view s-for="item, index in list">123</view>`)
    expect(output13).toBe(`<view s-for="item, index in list">123</view>`)
    expect(output14).toBe('<view s-for="t1, t2 in [0,1,2,3,4,5,6,7] trackBy t1">123</view>')
  })

  it('should transform button correct', function () {
    const input1 = `<button open-type="getUserInfo">获取用户信息</button>`
    const input2 = `<button open-type="getPhoneNumber">获取手机号</button>`
    const input3 = `<button open-type="openSetting">打开设置面板</button>`
    const input4 = `<button open-type="{{aaa}}">{{name}}</button>`

    const output1 = compileAndParse(input1, { srcMode: 'wx', mode: 'ali' })
    const output2 = compileAndParse(input2, { srcMode: 'wx', mode: 'ali' })
    compileAndParse(input3, { srcMode: 'wx', mode: 'ali' })
    const output4 = compileAndParse(input4, { srcMode: 'wx', mode: 'tt' })

    expect(output1).toBe('<button open-type="getAuthorize" scope="userInfo">获取用户信息</button>')
    expect(output2).toBe('<button open-type="getAuthorize" scope="phoneNumber">获取手机号</button>')
    expect(errorFn).toHaveBeenCalledWith(`<button>'s property 'open-type' does not support '[openSetting]' value in ali environment!`)
    expect(output4).toBe('<button open-type="{{aaa}}">{{name}}</button>')
  })

  it('should trans event binding for tt miniapp', function () {
    const input1 = `<test-comp1 bind:click="clickHandler">123</test-comp1>`
    const input1b = `<test-comp1 bindclick="clickHandler">123</test-comp1>`
    const input2 = `<test-comp1 catch:click="clickHandler">123</test-comp1>`
    const input2b = `<test-comp1 catchclick="clickHandler">123</test-comp1>`
    const input3 = `<test-comp1 bind:click.trim="clickHandler">123</test-comp1>`
    const input5 = `<test-comp1 capture-bind:click="clickHandler">123</test-comp1>`
    const input6 = `<test-comp1 capture-catch:click="clickHandler">123</test-comp1>`

    // 有没冒号都能用，按原文转
    const output1 = compileAndParse(input1, { srcMode: 'wx', mode: 'tt' })
    expect(output1).toBe('<test-comp1 bind:click="clickHandler">123</test-comp1>')
    expect(warnFn).not.toHaveBeenCalled()

    const output1b = compileAndParse(input1b, { srcMode: 'wx', mode: 'tt' })
    expect(output1b).toBe('<test-comp1 bindclick="clickHandler">123</test-comp1>')
    expect(warnFn).not.toHaveBeenCalled()

    const output2 = compileAndParse(input2, { srcMode: 'wx', mode: 'tt' })
    expect(output2).toBe('<test-comp1 catch:click="clickHandler">123</test-comp1>')
    expect(warnFn).not.toHaveBeenCalled()

    const output2b = compileAndParse(input2b, { srcMode: 'wx', mode: 'tt' })
    expect(output2b).toBe('<test-comp1 catchclick="clickHandler">123</test-comp1>')
    expect(warnFn).not.toHaveBeenCalled()

    const output3 = compileAndParse(input3, { srcMode: 'wx', mode: 'tt' })
    expect(output3).toBe('<test-comp1 bind:click.trim="clickHandler">123</test-comp1>')
    expect(warnFn).not.toHaveBeenCalled()

    const output4 = compileAndParse(input3, { srcMode: 'wx', mode: 'wx' })
    expect(output4).toBe('<test-comp1 bind:click.trim="clickHandler">123</test-comp1>')
    expect(warnFn).not.toHaveBeenCalled()

    const output5 = compileAndParse(input5, { srcMode: 'wx', mode: 'tt' })
    expect(output5).toBe('<test-comp1 bindclick="clickHandler">123</test-comp1>')
    expect(warnFn).toHaveBeenCalledWith(`bytedance miniapp doens't support 'capture-bind' and will be translated into 'bind' automatically!`)
    warnFn.mockClear()

    const output6 = compileAndParse(input6, { srcMode: 'wx', mode: 'tt' })
    expect(output6).toBe('<test-comp1 bindclick="clickHandler">123</test-comp1>')
    expect(warnFn).toHaveBeenCalledWith(`bytedance miniapp doens't support 'capture-catch' and will be translated into 'bind' automatically!`)
    warnFn.mockClear()
  })
})
