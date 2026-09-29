const { compileTemplate, warnFn } = require('../../util')

describe('scroll-view', () => {
  afterEach(() => {
    warnFn.mockClear()
  })

  it.each([
    ['omitted', '<scroll-view></scroll-view>'],
    ['empty', '<scroll-view show-scrollbar></scroll-view>'],
    ['empty string', '<scroll-view show-scrollbar=""></scroll-view>'],
    ['boolean true', '<scroll-view show-scrollbar="{{true}}"></scroll-view>'],
    ['string false', '<scroll-view show-scrollbar="false"></scroll-view>'],
    ['undefined', '<scroll-view show-scrollbar="{{undefined}}"></scroll-view>'],
    ['null', '<scroll-view show-scrollbar="{{null}}"></scroll-view>'],
    ['zero', '<scroll-view show-scrollbar="{{0}}"></scroll-view>']
  ])('should keep the native scrollbar default for %s', (name, input) => {
    expect(compileTemplate(input)).toBe('<scroll-view></scroll-view>')
  })

  it('should add a static hidden class for boolean false', () => {
    expect(compileTemplate('<scroll-view show-scrollbar="{{false}}"></scroll-view>'))
      .toBe('<scroll-view class="mpx-scrollbar-hidden"></scroll-view>')
    expect(warnFn).not.toHaveBeenCalled()
  })

  it('should preserve the original class when the native scrollbar default is used', () => {
    expect(compileTemplate('<scroll-view class="list" show-scrollbar="{{true}}"></scroll-view>'))
      .toBe('<scroll-view class="list"></scroll-view>')
    expect(compileTemplate('<scroll-view show-scrollbar class="list"></scroll-view>'))
      .toBe('<scroll-view class="list"></scroll-view>')
  })

  it('should add a strict dynamic hidden class without changing other attributes', () => {
    const input = '<scroll-view class="list {{sizeClass}}" scroll-y="{{true}}" show-scrollbar="{{showScrollbar}}" bindscroll="handleScroll"></scroll-view>'
    expect(compileTemplate(input)).toBe('<scroll-view scroll-y="{{true}}" onScroll="handleScroll" class="list {{sizeClass}} {{(showScrollbar) === false ? \'mpx-scrollbar-hidden\' : \'\'}}"></scroll-view>')
  })

  it('should produce the same class when attributes are reordered', () => {
    const before = compileTemplate('<scroll-view class="list" show-scrollbar="{{showScrollbar}}"></scroll-view>')
    const after = compileTemplate('<scroll-view show-scrollbar="{{showScrollbar}}" class="list"></scroll-view>')
    expect(before).toBe(after)
  })

  it('should merge the generated class with wx:class', () => {
    const output = compileTemplate('<scroll-view class="list" wx:class="{{dynamicClass}}" show-scrollbar="{{showScrollbar}}"></scroll-view>')
    expect(output).toContain('mpx-scrollbar-hidden')
    expect(output).toContain('dynamicClass')
    expect(output).not.toContain('show-scrollbar')
  })

  it('should respect conditional attributes', () => {
    expect(compileTemplate('<scroll-view show-scrollbar@wx="{{false}}"></scroll-view>'))
      .toBe('<scroll-view></scroll-view>')
    expect(compileTemplate('<scroll-view show-scrollbar@ali="{{false}}"></scroll-view>'))
      .toBe('<scroll-view class="mpx-scrollbar-hidden"></scroll-view>')
  })

  it('should not transform non-ali targets or ali source templates', () => {
    const input = '<scroll-view show-scrollbar="{{false}}"></scroll-view>'
    expect(compileTemplate(input, { mode: 'wx' })).toBe(input)
    expect(compileTemplate(input, { mode: 'ali', srcMode: 'ali' })).toBe(input)
  })

  it('should preserve diagnostics for unsupported targets', () => {
    compileTemplate('<scroll-view show-scrollbar="{{false}}"></scroll-view>', { mode: 'tt' })
    expect(warnFn.mock.calls[0][0]).toContain('show-scrollbar')
  })
})
