const { compileTemplate, warnFn } = require('../../util')

describe('React Native event handling', () => {
  afterEach(() => {
    warnFn.mockClear()
  })

  test.each(['ios', 'android', 'harmony'])('keeps catch and capture handling for touch events in %s mode', (mode) => {
    const input = '<view catchtap="handleTap" capture-bind:touchstart="handleTouchstart"></view>'
    const output = compileTemplate(input, { mode })

    expect(output).toContain('catchtap')
    expect(output).toContain('capture-bindtouchstart')
    expect(warnFn).not.toHaveBeenCalled()
  })

  test.each(['ios', 'android', 'harmony'])('warns and converts unsupported event handling to bind in %s mode', (mode) => {
    const input = '<input catchinput="handleInput" capture-bind:focus="handleFocus" capture-catch:blur="handleBlur" />'
    const output = compileTemplate(input, { mode })

    expect(output).toContain('bindinput')
    expect(output).toContain('bindfocus')
    expect(output).toContain('bindblur')
    expect(output).not.toContain('catchinput')
    expect(output).not.toContain('capture-bindfocus')
    expect(output).not.toContain('capture-catchblur')
    expect(warnFn).toHaveBeenCalledTimes(3)
    expect(warnFn).toHaveBeenCalledWith(
      expect.stringContaining('does not support [catch] event handling for [input] event'),
      undefined
    )
  })

  test('converts non-touch built-in component events to bind props', () => {
    const input = [
      '<switch catchchange="handleChange" />',
      '<slider catchchanging="handleChanging" />',
      '<view catchtransitionend="handleTransitionend"></view>',
      '<movable-view capture-catch:htouchmove="handleHtouchmove"></movable-view>'
    ].join('')
    const output = compileTemplate(input, { mode: 'ios' })

    expect(output).toContain('bindchange')
    expect(output).toContain('bindchanging')
    expect(output).toContain('bindtransitionend')
    expect(output).toContain('bindhtouchmove')
    expect(warnFn).toHaveBeenCalledTimes(4)
  })

  test('keeps catch handling for movable-view directional touchmove events', () => {
    const input = '<movable-view catchhtouchmove="handleHtouchmove" catchvtouchmove="handleVtouchmove"></movable-view>'
    const output = compileTemplate(input, { mode: 'ios' })

    expect(output).toContain('catchhtouchmove')
    expect(output).toContain('catchvtouchmove')
    expect(warnFn).not.toHaveBeenCalled()
  })
})
