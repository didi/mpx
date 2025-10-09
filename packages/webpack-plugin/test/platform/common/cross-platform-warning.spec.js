const { compileTemplate, warnFn, errorFn } = require('../util')

describe('cross-platform syntax warning', function () {
  afterEach(() => {
    warnFn.mockClear()
    errorFn.mockClear()
  })

  it('should not warn for auto-converted attributes (wx:class in ali mode)', function () {
    // wx:class 会被平台转换规则自动转换为 a:class，所以不会警告
    const input = '<view wx:class="{{someClass}}">content</view>'
    compileTemplate(input, { mode: 'ali' })
    expect(warnFn).not.toHaveBeenCalled()
  })

  it('should warn when using a: prefix in wx mode (no auto-conversion)', function () {
    // a:class 在 wx 模式下没有转换规则，会触发警告
    const input = '<view a:class="{{someClass}}">content</view>'
    compileTemplate(input, { mode: 'wx' })
    expect(warnFn).toHaveBeenCalledWith(
      expect.stringContaining('Your target mode is "wx", but used "a:class". Did you mean "wx:class"?')
    )
  })

  it('should warn when using s- prefix in wx mode (no auto-conversion)', function () {
    // s-if 在 wx 模式下没有转换规则，会触发警告
    const input = '<view s-if="{{condition}}">content</view>'
    compileTemplate(input, { mode: 'wx' })
    expect(warnFn).toHaveBeenCalledWith(
      expect.stringContaining('Your target mode is "wx", but used "s-if". Did you mean "wx:if"?')
    )
  })

  it('should warn when using qq: prefix in ali mode (no auto-conversion)', function () {
    // qq:for 在 ali 模式下没有转换规则，会触发警告
    const input = '<view qq:for="{{items}}">content</view>'
    compileTemplate(input, { mode: 'ali' })
    expect(warnFn).toHaveBeenCalledWith(
      expect.stringContaining('Your target mode is "ali", but used "qq:for". Did you mean "a:for"?')
    )
  })

  it('should warn when using tt: prefix in swan mode (no auto-conversion)', function () {
    // tt:style 在 swan 模式下没有转换规则，会触发警告
    const input = '<view tt:style="{{dynamicStyle}}">content</view>'
    compileTemplate(input, { mode: 'swan' })
    expect(warnFn).toHaveBeenCalledWith(
      expect.stringContaining('Your target mode is "swan", but used "tt:style". Did you mean "s-style"?')
    )
  })

  it('should warn when using dd: prefix in qq mode (no auto-conversion)', function () {
    // dd:show 在 qq 模式下没有转换规则，会触发警告
    const input = '<view dd:show="{{visible}}">content</view>'
    compileTemplate(input, { mode: 'qq' })
    expect(warnFn).toHaveBeenCalledWith(
      expect.stringContaining('Your target mode is "qq", but used "dd:show". Did you mean "qq:show"?')
    )
  })

  it('should not warn when using correct prefix for current mode', function () {
    const input1 = '<view wx:class="{{someClass}}">content</view>'
    compileTemplate(input1, { mode: 'wx' })
    expect(warnFn).not.toHaveBeenCalled()

    const input2 = '<view a:class="{{someClass}}">content</view>'
    compileTemplate(input2, { mode: 'ali' })
    expect(warnFn).not.toHaveBeenCalled()

    const input3 = '<view s-if="{{condition}}">content</view>'
    compileTemplate(input3, { mode: 'swan' })
    expect(warnFn).not.toHaveBeenCalled()

    const input4 = '<view qq:for="{{items}}">content</view>'
    compileTemplate(input4, { mode: 'qq' })
    expect(warnFn).not.toHaveBeenCalled()

    const input5 = '<view tt:style="{{dynamicStyle}}">content</view>'
    compileTemplate(input5, { mode: 'tt' })
    expect(warnFn).not.toHaveBeenCalled()
  })

  it('should not warn for regular attributes without platform prefixes', function () {
    const input = '<view class="normal" style="color: red;" id="test">content</view>'
    compileTemplate(input, { mode: 'ali' })
    expect(warnFn).not.toHaveBeenCalled()
  })

  it('should warn for cross-platform attributes without auto-conversion', function () {
    // 只检测没有自动转换规则的属性
    const input = '<view s-if="{{condition}}" qq:for="{{items}}">content</view>'
    compileTemplate(input, { mode: 'ali' })
    expect(warnFn).toHaveBeenCalledTimes(2)
    expect(warnFn).toHaveBeenCalledWith(
      expect.stringContaining('Your target mode is "ali", but used "s-if". Did you mean "a:if"?')
    )
    expect(warnFn).toHaveBeenCalledWith(
      expect.stringContaining('Your target mode is "ali", but used "qq:for". Did you mean "a:for"?')
    )
  })

  it('should work with nested elements', function () {
    // 只测试没有自动转换的属性
    const input = `
      <view s-if="{{condition}}">
        <text s-class="{{textClass}}">Hello</text>
      </view>
    `
    compileTemplate(input, { mode: 'ali' })
    expect(warnFn).toHaveBeenCalledTimes(2)
    expect(warnFn).toHaveBeenCalledWith(
      expect.stringContaining('Your target mode is "ali", but used "s-if". Did you mean "a:if"?')
    )
    expect(warnFn).toHaveBeenCalledWith(
      expect.stringContaining('Your target mode is "ali", but used "s-class". Did you mean "a:class"?')
    )
  })

  it('should handle all supported platforms', function () {
    // Test jd: prefix
    const input1 = '<view jd:ref="myRef">content</view>'
    compileTemplate(input1, { mode: 'wx' })
    expect(warnFn).toHaveBeenCalledWith(
      expect.stringContaining('Your target mode is "wx", but used "jd:ref". Did you mean "wx:ref"?')
    )

    warnFn.mockClear()

    // Test qa: prefix
    const input2 = '<view qa:key="{{item.id}}">content</view>'
    compileTemplate(input2, { mode: 'tt' })
    expect(warnFn).toHaveBeenCalledWith(
      expect.stringContaining('Your target mode is "tt", but used "qa:key". Did you mean "tt:key"?')
    )
  })

  it('should error for React Native platforms when using non-wx prefixes', function () {
    const input = '<view a:class="{{someClass}}">content</view>'

    // Test android
    compileTemplate(input, { mode: 'android' })
    expect(errorFn).toHaveBeenCalledWith(
      expect.stringContaining('React Native mode "android" does not support "a:" prefix. Use "wx:" prefix instead. Found: "a:class"')
    )

    errorFn.mockClear()

    // Test ios
    compileTemplate(input, { mode: 'ios' })
    expect(errorFn).toHaveBeenCalledWith(
      expect.stringContaining('React Native mode "ios" does not support "a:" prefix. Use "wx:" prefix instead. Found: "a:class"')
    )

    errorFn.mockClear()

    // Test harmony
    compileTemplate(input, { mode: 'harmony' })
    expect(errorFn).toHaveBeenCalledWith(
      expect.stringContaining('React Native mode "harmony" does not support "a:" prefix. Use "wx:" prefix instead. Found: "a:class"')
    )
  })

  it('should not warn for React Native platforms when using wx: prefix', function () {
    const input = '<view wx:class="{{someClass}}">content</view>'

    // Test android
    compileTemplate(input, { mode: 'android' })
    expect(warnFn).not.toHaveBeenCalled()
    expect(errorFn).not.toHaveBeenCalled()

    // Test ios
    compileTemplate(input, { mode: 'ios' })
    expect(warnFn).not.toHaveBeenCalled()
    expect(errorFn).not.toHaveBeenCalled()

    // Test harmony
    compileTemplate(input, { mode: 'harmony' })
    expect(warnFn).not.toHaveBeenCalled()
    expect(errorFn).not.toHaveBeenCalled()
  })

  it('should handle conditional compilation attributes correctly', function () {
    // 测试 wx to ali 场景下的条件编译属性
    const input1 = '<alicom@ali a:if="{{show}}">content</alicom>'
    compileTemplate(input1, { srcMode: 'wx', mode: 'ali' })
    expect(warnFn).not.toHaveBeenCalled() // 应该不警告，因为目标是ali模式

    const input2 = '<com a:if@ali="{{show}}">content</com>'
    compileTemplate(input2, { srcMode: 'wx', mode: 'ali' })
    expect(warnFn).not.toHaveBeenCalled() // 应该不警告，因为目标是ali模式
  })

  it('should warn when using a: prefix in web mode', function () {
    // web 模式应该使用 v- 前缀，使用 a: 会警告
    const input = '<view a:class="someClass">content</view>'
    compileTemplate(input, { mode: 'web' })
    expect(warnFn).toHaveBeenCalledWith(
      expect.stringContaining('Your target mode is "web", but used "a:class". Did you mean "v-class"?')
    )
  })

  it('should warn when using s- prefix in web mode', function () {
    // web 模式应该使用 v- 前缀，使用 s- 会警告
    const input = '<view s-if="condition">content</view>'
    compileTemplate(input, { mode: 'web' })
    expect(warnFn).toHaveBeenCalledWith(
      expect.stringContaining('Your target mode is "web", but used "s-if". Did you mean "v-if"?')
    )
  })

  it('should not warn when using v- prefix in web mode', function () {
    // web 模式使用 v- 前缀不应该警告
    const input = '<div v-if="condition">content</div>'
    compileTemplate(input, { mode: 'web' })
    expect(warnFn).not.toHaveBeenCalled()
  })

  it('should warn when using v- prefix in miniprogram mode', function () {
    // 小程序模式使用 v- 前缀应该警告
    const input = '<view v-if="condition">content</view>'
    compileTemplate(input, { mode: 'wx' })
    expect(warnFn).toHaveBeenCalledWith(
      expect.stringContaining('Your target mode is "wx", but used "v-if". Did you mean "wx:if"?')
    )
  })
})
