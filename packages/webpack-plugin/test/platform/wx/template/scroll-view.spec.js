const { compileTemplate, warnFn, errorFn } = require('../../util')

describe('scroll-view template should transform correct', function () {
  afterEach(() => {
    warnFn.mockClear()
    errorFn.mockClear()
  })

  it('should not warn about enable-flex when wx:if is false', function () {
    const input = '<scroll-view wx:if="{{false}}" enable-flex="{{true}}" scroll-y="{{true}}">content</scroll-view>'
    const output = compileTemplate(input, { srcMode: 'wx', mode: 'ali' })

    // 当条件为 false 时，不应该有关于 enable-flex 的警告
    expect(warnFn).not.toHaveBeenCalledWith('<scroll-view> does not support [enable-flex] property in ali environment!')

    // 验证输出是否正确处理了条件编译
    expect(output).toBe('')
  })

  it('should warn about enable-flex when wx:if is true', function () {
    const input = '<scroll-view wx:if="{{true}}" enable-flex="{{true}}" scroll-y="{{true}}">content</scroll-view>'
    compileTemplate(input, { srcMode: 'wx', mode: 'ali' })

    // 当条件为 true 时，应该有关于 enable-flex 的警告
    expect(warnFn).toHaveBeenCalledWith('<scroll-view> does not support [enable-flex] property in ali environment!')
  })

  it('should warn about enable-flex when wx:if is not static', function () {
    const input = '<scroll-view wx:if="{{someVariable}}" enable-flex="{{true}}" scroll-y="{{true}}">content</scroll-view>'
    compileTemplate(input, { srcMode: 'wx', mode: 'ali' })

    // 当条件不是静态的时，应该有关于 enable-flex 的警告
    expect(warnFn).toHaveBeenCalledWith('<scroll-view> does not support [enable-flex] property in ali environment!')
  })

  it('should warn about enable-flex when no wx:if', function () {
    const input = '<scroll-view enable-flex="{{true}}" scroll-y="{{true}}">content</scroll-view>'
    compileTemplate(input, { srcMode: 'wx', mode: 'ali' })

    // 当没有条件时，应该有关于 enable-flex 的警告
    expect(warnFn).toHaveBeenCalledWith('<scroll-view> does not support [enable-flex] property in ali environment!')
  })

  it('should not warn about enable-flex when wx:if is false with mustache', function () {
    const input = '<scroll-view wx:if="{{false}}" enable-flex="{{true}}" nestedScrollEnabled="{{true}}" wx:ref="scrollView" class="scroll-view-inner" scroll-y="{{innerScroll}}">11111</scroll-view>'
    const output = compileTemplate(input, { srcMode: 'wx', mode: 'ali' })

    // 当条件为 false 时，不应该有关于 enable-flex 的警告
    expect(warnFn).not.toHaveBeenCalledWith('<scroll-view> does not support [enable-flex] property in ali environment!')

    // 验证输出是否正确处理了条件编译
    expect(output).toBe('')
  })
}) 