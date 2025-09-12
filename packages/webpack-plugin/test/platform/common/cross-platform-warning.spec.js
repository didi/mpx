const { compileTemplate, warnFn, errorFn } = require('../util')

describe('cross-platform syntax warning', function () {
  afterEach(() => {
    warnFn.mockClear()
    errorFn.mockClear()
  })

  it('should warn when using wx: prefix in ali mode', function () {
    const input = '<view wx:class="{{someClass}}">content</view>'
    compileTemplate(input, { srcMode: 'ali' })
    expect(warnFn).toHaveBeenCalledWith(
      expect.stringContaining('Your src mode is "ali", but used "wx:class". Did you mean "a:class"?')
    )
  })

  it('should warn when using a: prefix in wx mode', function () {
    const input = '<view a:class="{{someClass}}">content</view>'
    compileTemplate(input, { srcMode: 'wx' })
    expect(warnFn).toHaveBeenCalledWith(
      expect.stringContaining('Your src mode is "wx", but used "a:class". Did you mean "wx:class"?')
    )
  })

  it('should warn when using s- prefix in wx mode', function () {
    const input = '<view s-if="{{condition}}">content</view>'
    compileTemplate(input, { srcMode: 'wx' })
    expect(warnFn).toHaveBeenCalledWith(
      expect.stringContaining('Your src mode is "wx", but used "s-if". Did you mean "wx:if"?')
    )
  })

  it('should warn when using qq: prefix in ali mode', function () {
    const input = '<view qq:for="{{items}}">content</view>'
    compileTemplate(input, { srcMode: 'ali' })
    expect(warnFn).toHaveBeenCalledWith(
      expect.stringContaining('Your src mode is "ali", but used "qq:for". Did you mean "a:for"?')
    )
  })

  it('should warn when using tt: prefix in swan mode', function () {
    const input = '<view tt:style="{{dynamicStyle}}">content</view>'
    compileTemplate(input, { srcMode: 'swan' })
    expect(warnFn).toHaveBeenCalledWith(
      expect.stringContaining('Your src mode is "swan", but used "tt:style". Did you mean "s-style"?')
    )
  })

  it('should warn when using dd: prefix in qq mode', function () {
    const input = '<view dd:show="{{visible}}">content</view>'
    compileTemplate(input, { srcMode: 'qq' })
    expect(warnFn).toHaveBeenCalledWith(
      expect.stringContaining('Your src mode is "qq", but used "dd:show". Did you mean "qq:show"?')
    )
  })

  it('should not warn when using correct prefix for current srcMode', function () {
    const input1 = '<view wx:class="{{someClass}}">content</view>'
    compileTemplate(input1, { srcMode: 'wx' })
    expect(warnFn).not.toHaveBeenCalled()

    const input2 = '<view a:class="{{someClass}}">content</view>'
    compileTemplate(input2, { srcMode: 'ali' })
    expect(warnFn).not.toHaveBeenCalled()

    const input3 = '<view s-if="{{condition}}">content</view>'
    compileTemplate(input3, { srcMode: 'swan' })
    expect(warnFn).not.toHaveBeenCalled()

    const input4 = '<view qq:for="{{items}}">content</view>'
    compileTemplate(input4, { srcMode: 'qq' })
    expect(warnFn).not.toHaveBeenCalled()

    const input5 = '<view tt:style="{{dynamicStyle}}">content</view>'
    compileTemplate(input5, { srcMode: 'tt' })
    expect(warnFn).not.toHaveBeenCalled()
  })

  it('should not warn for regular attributes without platform prefixes', function () {
    const input = '<view class="normal" style="color: red;" id="test">content</view>'
    compileTemplate(input, { srcMode: 'ali' })
    expect(warnFn).not.toHaveBeenCalled()
  })

  it('should warn for multiple cross-platform attributes in one element', function () {
    const input = '<view wx:class="{{someClass}}" s-if="{{condition}}" qq:for="{{items}}">content</view>'
    compileTemplate(input, { srcMode: 'ali' })
    expect(warnFn).toHaveBeenCalledTimes(3)
    expect(warnFn).toHaveBeenCalledWith(
      expect.stringContaining('Your src mode is "ali", but used "wx:class". Did you mean "a:class"?')
    )
    expect(warnFn).toHaveBeenCalledWith(
      expect.stringContaining('Your src mode is "ali", but used "s-if". Did you mean "a:if"?')
    )
    expect(warnFn).toHaveBeenCalledWith(
      expect.stringContaining('Your src mode is "ali", but used "qq:for". Did you mean "a:for"?')
    )
  })

  it('should work with nested elements', function () {
    const input = `
      <view wx:if="{{condition}}">
        <text s-class="{{textClass}}">Hello</text>
      </view>
    `
    compileTemplate(input, { srcMode: 'ali' })
    expect(warnFn).toHaveBeenCalledTimes(2)
    expect(warnFn).toHaveBeenCalledWith(
      expect.stringContaining('Your src mode is "ali", but used "wx:if". Did you mean "a:if"?')
    )
    expect(warnFn).toHaveBeenCalledWith(
      expect.stringContaining('Your src mode is "ali", but used "s-class". Did you mean "a:class"?')
    )
  })

  it('should handle all supported platforms', function () {
    // Test jd: prefix
    const input1 = '<view jd:ref="myRef">content</view>'
    compileTemplate(input1, { srcMode: 'wx' })
    expect(warnFn).toHaveBeenCalledWith(
      expect.stringContaining('Your src mode is "wx", but used "jd:ref". Did you mean "wx:ref"?')
    )

    warnFn.mockClear()

    // Test qa: prefix
    const input2 = '<view qa:key="{{item.id}}">content</view>'
    compileTemplate(input2, { srcMode: 'tt' })
    expect(warnFn).toHaveBeenCalledWith(
      expect.stringContaining('Your src mode is "tt", but used "qa:key". Did you mean "tt:key"?')
    )
  })

  it('should not warn for React Native platforms (android/ios/harmony) and noMode', function () {
    const input = '<view wx:class="{{someClass}}" a:if="{{condition}}">content</view>'

    // Test android
    compileTemplate(input, { srcMode: 'android' })
    expect(warnFn).not.toHaveBeenCalled()

    // Test ios
    compileTemplate(input, { srcMode: 'ios' })
    expect(warnFn).not.toHaveBeenCalled()

    // Test harmony
    compileTemplate(input, { srcMode: 'harmony' })
    expect(warnFn).not.toHaveBeenCalled()

    // Test noMode
    compileTemplate(input, { srcMode: 'noMode' })
    expect(warnFn).not.toHaveBeenCalled()
  })
})
