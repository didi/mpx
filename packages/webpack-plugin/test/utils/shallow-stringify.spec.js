const shallowStringify = require('../../lib/utils/shallow-stringify')

describe('shallowStringify defensive string literal handling', () => {
  test('should stringify bare string values to valid JS string literal', () => {
    const code = shallowStringify({ fontFamily: 'PingFangSC-Regular' })
    expect(code).toBe('{\'fontFamily\':\"PingFangSC-Regular\"}')
  })

  test('should keep numeric string as number literal', () => {
    const code = shallowStringify({ letterSpacing: '2' })
    expect(code).toBe('{\'letterSpacing\':2}')
  })

  test('should keep already-quoted JS string literal', () => {
    const code = shallowStringify({ fontFamily: '"PingFangSC-Regular"' })
    expect(code).toBe('{\'fontFamily\':\"PingFangSC-Regular\"}')
  })

  test('should keep function call expressions', () => {
    const code = shallowStringify({ width: "global.__formatValue(2, 'rpx')" })
    expect(code).toBe('{\'width\':global.__formatValue(2, \'rpx\')}')
  })
})

