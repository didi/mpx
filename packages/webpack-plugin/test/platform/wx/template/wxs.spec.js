const { compileAndParse, warnFn, errorFn } = require('../../util')

describe('template should transform correct', function () {
  afterEach(() => {
    warnFn.mockClear()
    errorFn.mockClear()
  })

  it('should transform normally in ali env', function () {
    const input = `<wxs module="m1" src="./test.wxs"></wxs><view>123</view>`

    expect(compileAndParse(input)).toBe('<import-sjs name="m1" from="./test.wxs"></import-sjs><view>123</view>')
    expect(errorFn).not.toHaveBeenCalled()
  })
})
