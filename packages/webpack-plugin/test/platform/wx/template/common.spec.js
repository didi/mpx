const { compileAndParse, warnFn, errorFn, resolve } = require('../../util')

describe('common spec case', function () {
  afterEach(() => {
    warnFn.mockClear()
    errorFn.mockClear()
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

  it('should optimize key of for in swan', function () {
    const input1 = `<view wx:for="{{list}}" wx:for-item="t1" wx:for-index="t2" wx:key="u1">123</view>`
    const input2 = `<view wx:for="strings" wx:for-item="t1" wx:for-index="t2" wx:key="u1">123</view>`
    const input3 = `<view wx:for="{{8}}" wx:for-item="t1" wx:for-index="t2" wx:key="u1">123</view>`
    const output1 = compileAndParse(input1, { srcMode: 'wx', mode: 'swan' })
    const output2 = compileAndParse(input2, { srcMode: 'wx', mode: 'swan' })
    const output3 = compileAndParse(input3, { srcMode: 'wx', mode: 'swan' })
    const wxsPath = resolve('../lib/runtime/swanHelper.wxs')
    expect(output1).toBe(`<import-sjs module="__swanHelper__" src="~${wxsPath}"></import-sjs><view s-for="t1, t2 in __swanHelper__.processFor(list) trackBy t1.u1">123</view>`)
    expect(output2).toBe(`<import-sjs module="__swanHelper__" src="~${wxsPath}"></import-sjs><view s-for='t1, t2 in __swanHelper__.processFor("strings") trackBy t1.u1'>123</view>`)
    expect(output3).toBe(`<import-sjs module="__swanHelper__" src="~${wxsPath}"></import-sjs><view s-for="t1, t2 in __swanHelper__.processFor(8) trackBy t1.u1">123</view>`)
  })
})
