const { compileTemplate, warnFn, errorFn } = require('../../util')

describe('picker template transform', function () {
  afterEach(() => {
    warnFn.mockClear()
    errorFn.mockClear()
  })

  it('should support header-text in react native modes', function () {
    const input = '<picker header-text="{{ headerTextTest }}"></picker>'
    const modes = ['ios', 'android', 'harmony']

    modes.forEach((mode) => {
      compileTemplate(input, { srcMode: 'wx', mode })
    })

    expect(warnFn.mock.calls.map(args => args[0])).not.toEqual(expect.arrayContaining([
      expect.stringContaining('<picker> does not support [header-text] property')
    ]))
    expect(errorFn).not.toHaveBeenCalled()
  })
})
