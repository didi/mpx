const { compileTemplate, warnFn, errorFn } = require('../../util')

afterEach(() => {
  warnFn.mockClear()
  errorFn.mockClear()
})

test.each(['ios', 'android', 'harmony'])('preserves enable-var modes for %s', mode => {
  const input = '<view enable-var="use"><text enable-var@ios|android|harmony="use" /></view>'
  const output = compileTemplate(input, { mode })
  expect(output.match(/"enable-var": "use"/g)).toHaveLength(2)
  expect(compileTemplate('<view enable-var />', { mode })).toContain('"enable-var": (true)')
  expect(compileTemplate('<view enable-var="{{true}}" />', { mode })).toContain('"enable-var": (true)')
  expect(warnFn).not.toHaveBeenCalled()
  expect(errorFn).not.toHaveBeenCalled()
})
