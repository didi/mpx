const { compileTemplate, warnFn, errorFn } = require('../../util')

describe('swiper template transform', function () {
  afterEach(() => {
    warnFn.mockClear()
    errorFn.mockClear()
  })

  it('should preserve display-multiple-items in react native modes', function () {
    const input = '<swiper display-multiple-items="3"></swiper>'

    ;['ios', 'android', 'harmony'].forEach((mode) => {
      expect(compileTemplate(input, { srcMode: 'wx', mode })).toContain('"display-multiple-items": "3"')
    })

    expect(warnFn).not.toHaveBeenCalled()
    expect(errorFn).not.toHaveBeenCalled()
  })

  it('should continue warning unsupported properties in react native modes', function () {
    const input = '<swiper snap-to-edge="true"></swiper>'

    ;['ios', 'android', 'harmony'].forEach((mode) => {
      expect(compileTemplate(input, { srcMode: 'wx', mode })).toContain('"snap-to-edge": "true"')
    })

    expect(warnFn.mock.calls.map(args => args[0])).toEqual([
      '<swiper> does not support [snap-to-edge] property in ios environment!',
      '<swiper> does not support [snap-to-edge] property in android environment!',
      '<swiper> does not support [snap-to-edge] property in harmony environment!'
    ])
    expect(errorFn).not.toHaveBeenCalled()
  })
})
