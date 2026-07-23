const { compileTemplate, warnFn, errorFn } = require('../../util')

describe('swiper template transform', function () {
  afterEach(() => {
    warnFn.mockClear()
    errorFn.mockClear()
  })

  it('should support display-multiple-items in react native modes', function () {
    const input = '<swiper display-multiple-items="3"></swiper>'

    ;['ios', 'android', 'harmony'].forEach((mode) => {
      compileTemplate(input, { srcMode: 'wx', mode })
    })

    expect(warnFn.mock.calls.map(args => args[0])).not.toEqual(expect.arrayContaining([
      expect.stringContaining('<swiper> does not support [display-multiple-items] property')
    ]))
    expect(errorFn).not.toHaveBeenCalled()
  })

  it('should continue warning unsupported properties in react native modes', function () {
    const input = '<swiper snap-to-edge="true"></swiper>'

    ;['ios', 'android', 'harmony'].forEach((mode) => {
      compileTemplate(input, { srcMode: 'wx', mode })
    })

    expect(warnFn.mock.calls.map(args => args[0])).toEqual(expect.arrayContaining([
      expect.stringContaining('<swiper> does not support [snap-to-edge] property')
    ]))
    expect(errorFn).not.toHaveBeenCalled()
  })
})
