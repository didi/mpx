const { compileTemplate, warnFn, errorFn } = require('../util')

const compileTemplateToIos = (input) => compileTemplate(input, { mode: 'ios' })

describe('react/rn wx:key compatible cases', function () {
  afterEach(() => {
    warnFn.mockClear()
    errorFn.mockClear()
  })

  it('should treat wx:key same as wx:for-index as index key', function () {
    const input = '<view wx:for="{{list}}" wx:for-item="item" wx:for-index="idx" wx:key="idx">a</view>'
    const output = compileTemplateToIos(input)
    expect(output).toBe(
      'this.__iter((list), function(item,idx){return createElement(getComponent("mpx-view"), { key: this.__getWxKey(item, "index", idx) },createElement(getComponent("mpx-inline-text"), null,"a"))})'
    )
  })

  it('should treat wx:key="idx" as index key (legacy write)', function () {
    const input = '<view wx:for="{{list}}" wx:for-item="item" wx:key="idx">a</view>'
    const output = compileTemplateToIos(input)
    expect(output).toBe(
      'this.__iter((list), function(item,index){return createElement(getComponent("mpx-view"), { key: this.__getWxKey(item, "index", index) },createElement(getComponent("mpx-inline-text"), null,"a"))})'
    )
  })
})

