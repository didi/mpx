const { compileTemplate, warnFn, errorFn } = require('../../util')

describe('template should transform correct', function () {
  afterEach(() => {
    warnFn.mockClear()
    errorFn.mockClear()
  })

  it('should transform normally in ali env', function () {
    const input = '<wxs module="m1" src="./test.wxs"></wxs><view>123</view>'

    expect(compileTemplate(input)).toBe('<import-sjs name="m1" from="./test.wxs"></import-sjs><view>123</view>')
    expect(errorFn).not.toHaveBeenCalled()
  })

  it('should transform normally in tt env', function () {
    const input = '<wxs module="m1" src="./test.wxs"></wxs><view>123</view>'

    // 文件后缀实际是sjs，test case没有走wxs-loader
    expect(compileTemplate(input, { srcMode: 'wx', mode: 'tt' })).toBe('<sjs module="m1" src="./test.wxs"></sjs><view>123</view>')
    expect(errorFn).not.toHaveBeenCalled()
  })
})
