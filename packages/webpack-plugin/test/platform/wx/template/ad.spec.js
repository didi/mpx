const { compileTemplate, warnFn, errorFn } = require('../../util')

describe('template should transform correct', function () {
  afterEach(() => {
    warnFn.mockClear()
    errorFn.mockClear()
  })

  it('should trans ad to tt platform correct', function () {
    const input = '<ad unit-id="123" ad-intervals="10" ad-type="banner" bindload="handleLoad" binderror="handleError" bindclose="handleClose"></ad>'
    const output = compileTemplate(input, { srcMode: 'wx', mode: 'tt' })
    expect(output).toBe('<ad unit-id="123" ad-intervals="10" type="banner" bindload="handleLoad" binderror="handleError" bindclose="handleClose"></ad>')
  })

  it('should warning if type is not support in tt', function () {
    const input = '<ad unit-id="123" ad-intervals="10" ad-type="grid" bindload="handleLoad" binderror="handleError" bindclose="handleClose"></ad>'
    const output = compileTemplate(input, { srcMode: 'wx', mode: 'tt' })
    expect(output).toBe('<ad unit-id="123" ad-intervals="10" type="grid" bindload="handleLoad" binderror="handleError" bindclose="handleClose"></ad>')
    expect(warnFn).toHaveBeenCalledWith('<ad>\'s property \'type\' does not support \'[grid]\' value in bytedance environment!')
  })
})
