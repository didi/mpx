const { compileAndParse, warnFn, errorFn } = require('../../util')

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

    expect(output1).toBe('<view s-for="item, index in __swanTransFor__.processFor(list) trackBy item.unique">123</view>')
    expect(output2).toBe('<view s-for="item, index in __swanTransFor__.processFor(list)">123</view>')
    expect(output3).toBe('<view s-for="t1, index in __swanTransFor__.processFor(list)">123</view>')
    expect(output4).toBe('<view s-for="item, t1 in __swanTransFor__.processFor(list)">123</view>')
    expect(output5).toBe('<view s-for="t1, t2 in __swanTransFor__.processFor(list)">123</view>')
    expect(output6).toBe('<view s-for="t1, t2 in __swanTransFor__.processFor(list) trackBy t1.u1">123</view>')
    expect(output7).toBe(`<view s-for='t1, t2 in __swanTransFor__.processFor(["s","t","r","i","n","g","s"]) trackBy t1'>123</view>`)
    expect(output8).toBe(`<view s-for='t1, t2 in __swanTransFor__.processFor(["1","2","3"]) trackBy t1'>123</view>`)
    expect(output9).toBe('<view s-for="t1, t2 in __swanTransFor__.processFor([0,1,2,3,4,5,6,7]) trackBy t1">123</view>')
    expect(output10).toBe('<view s-for="item, index in __swanTransFor__.processFor(list) trackBy item">123</view>')
    expect(output11).toBe(`<view s-for="item, index in __swanTransFor__.processFor(list) trackBy item['a-b']">123</view>`)
    expect(output12).toBe(`<view s-for="item, index in __swanTransFor__.processFor(list)">123</view>`)
    expect(output13).toBe(`<view s-for="item, index in __swanTransFor__.processFor(list)">123</view>`)
    expect(output14).toBe('<view s-for="t1, t2 in __swanTransFor__.processFor([0,1,2,3,4,5,6,7]) trackBy t1">123</view>')
  })
})
