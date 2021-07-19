const { baseParse } = require('../../util')

describe('compiler: parse', () => {
  describe('Element', () => {
    test('simple view', () => {
      const res = baseParse('<view>hello mpx</view>')
      console.log('the res is:', res)
    })
  })
})