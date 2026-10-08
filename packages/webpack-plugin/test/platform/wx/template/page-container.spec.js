const { compileTemplate } = require('../../util')

describe('template should transform correct', function () {
  it('should transform beforeleave event for ali', function () {
    const input = '<page-container bind:beforeleave="handleBeforeLeave"></page-container>'
    const output = compileTemplate(input, { srcMode: 'wx', mode: 'ali' })

    expect(output).toBe('<page-container onBeforeLeave="handleBeforeLeave"></page-container>')
  })
})
