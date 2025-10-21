const { compileTemplate, warnFn, errorFn } = require('../util')

const compileTemplateToWx = (input) => compileTemplate(input, { mode: 'wx' })
const compileTemplateToIos = (input) => compileTemplate(input, { mode: 'ios' })

describe('template if should transform correct', function () {
  describe('normal cases', () => {
    beforeEach(() => {
      errorFn.mockClear()
      warnFn.mockClear()
    })

    afterEach(() => {
      expect(errorFn).not.toHaveBeenCalled()
      expect(warnFn).not.toHaveBeenCalled()
    })

    it('should handle wx:if correctly', function () {
      const input = '<text wx:if="{{condition}}">123</text>'
      const wxOutput = compileTemplateToWx(input)
      expect(wxOutput).toBe('<text wx:if="{{condition}}">123</text>')

      const iosOutput = compileTemplateToIos(input)
      expect(iosOutput).toBe('(condition)?createElement(getComponent("mpx-text"), null,"123"):null')
    })

    it('should handle if/elif/else correctly', function () {
      const input = `
        <view>
          <text wx:if="{{condition1}}">1</text>
          <text wx:elif="{{condition2}}">2</text>
          <text wx:else>3</text>
        </view>
      `
      const wxOutput = compileTemplateToWx(input)
      expect(wxOutput).toBe('<view><text wx:if="{{condition1}}">1</text><text wx:elif="{{condition2}}">2</text><text wx:else>3</text></view>')

      const iosOutput = compileTemplateToIos(input)
      expect(iosOutput).toBe('createElement(getComponent("mpx-view"), null,' +
        '(condition1)?createElement(getComponent("mpx-text"), null,"1"):' +
        '(condition2)?createElement(getComponent("mpx-text"), null,"2"):' +
        'createElement(getComponent("mpx-text"), null,"3"))')
    })

    it('should work with complex conditions', function () {
      const input = '<text wx:if="{{a > 0 && b < 1}}">123</text>'
      const wxOutput = compileTemplateToWx(input)
      expect(wxOutput).toBe('<text wx:if="{{a > 0 && b < 1}}">123</text>')

      const iosOutput = compileTemplateToIos(input)
      expect(iosOutput).toBe('(a > 0 && b < 1)?createElement(getComponent("mpx-text"), null,"123"):null')
    })

    it('should remove node when condition is false', function () {
      const input = '<view><text wx:if="{{false}}">1</text></view>'
      const wxOutput = compileTemplateToWx(input)
      expect(wxOutput).toBe('<view></view>')

      const iosOutput = compileTemplateToIos(input)
      expect(iosOutput).toBe('createElement(getComponent("mpx-view"), null)')
    })

    it('should keep node when condition is true', function () {
      const input = '<view><text wx:if="{{true}}">1</text></view>'
      const wxOutput = compileTemplateToWx(input)
      expect(wxOutput).toBe('<view><text>1</text></view>')

      const iosOutput = compileTemplateToIos(input)
      expect(iosOutput).toBe('createElement(getComponent("mpx-view"), null,' +
        'createElement(getComponent("mpx-text"), null,"1"))')
    })

    it('should handle __mpx_mode__ in condition', function () {
      const input = `
        <view>
          <text wx:if="{{__mpx_mode__ === 'wx'}}">wx</text>
          <text wx:if="{{__mpx_mode__ === 'ios'}}">ios</text>
          <text wx:if="{{__mpx_mode__ === 'ali'}}">ali</text>
        </view>
      `
      const wxOutput = compileTemplateToWx(input)
      expect(wxOutput).toBe('<view><text>wx</text></view>')

      const iosOutput = compileTemplateToIos(input)
      expect(iosOutput).toBe('createElement(getComponent("mpx-view"), null,' +
        'createElement(getComponent("mpx-text"), null,"ios"))')
    })

    it('should keep node when condition cannot be evaluated', function () {
      const input = `
        <view>
          <text wx:if="{{a > 1}}">1</text>
          <text wx:elif="{{b === 2}}">2</text>
          <text wx:else>3</text>
        </view>
      `
      const wxOutput = compileTemplateToWx(input)
      expect(wxOutput).toBe('<view><text wx:if="{{a > 1}}">1</text><text wx:elif="{{b === 2}}">2</text><text wx:else>3</text></view>')

      const iosOutput = compileTemplateToIos(input)
      expect(iosOutput).toBe('createElement(getComponent("mpx-view"), null,' +
        '(a > 1)?createElement(getComponent("mpx-text"), null,"1"):' +
        '(b === 2)?createElement(getComponent("mpx-text"), null,"2"):' +
        'createElement(getComponent("mpx-text"), null,"3"))')
    })

    it('should keep node when condition contains both static and dynamic parts', function () {
      const input = '<view><text wx:if="{{true && someVar}}">1</text></view>'
      const wxOutput = compileTemplateToWx(input)
      expect(wxOutput).toBe('<view><text wx:if="{{true && someVar}}">1</text></view>')

      const iosOutput = compileTemplateToIos(input)
      expect(iosOutput).toBe('createElement(getComponent("mpx-view"), null,' +
        '(true && someVar)?createElement(getComponent("mpx-text"), null,"1"):null)')
    })
  })

  describe('error cases', () => {
    const originalErrorFn = errorFn
    beforeAll(() => {
      errorFn.mockImplementation(() => {})
    })

    afterAll(() => {
      errorFn.mockImplementation(originalErrorFn)
    })

    beforeEach(() => {
      errorFn.mockClear()
      warnFn.mockClear()
    })

    afterEach(() => {
      expect(warnFn).not.toHaveBeenCalled()
    })

    it('should throw error when else used without if', function () {
      const input = `
        <view>
          <text wx:else>3</text>
        </view>
      `
      compileTemplateToWx(input)
      expect(errorFn).toHaveBeenCalledWith('wx:else used on element [text] without corresponding wx:if or wx:elif.')

      compileTemplateToIos(input)
      expect(errorFn).toHaveBeenCalledWith('wx:else used on element [text] without corresponding wx:if or wx:elif.')
    })

    it('should throw error when elif used without if', function () {
      const input = `
        <view>
          <text wx:elif="{{condition}}">2</text>
        </view>
      `
      compileTemplateToWx(input)
      expect(errorFn).toHaveBeenCalledWith('wx:elif="{{condition}}" used on element [text] without corresponding wx:if or wx:elif.')

      compileTemplateToIos(input)
      expect(errorFn).toHaveBeenCalledWith('wx:elif="{{condition}}" used on element [text] without corresponding wx:if or wx:elif.')
    })

    it('should throw error when multiple else used', function () {
      const input = `
        <view>
          <text wx:if="{{condition}}">1</text>
          <text wx:else>2</text>
          <text wx:else>3</text>
        </view>
      `
      compileTemplateToWx(input)
      expect(errorFn).toHaveBeenCalledWith('wx:else used on element [text] without corresponding wx:if or wx:elif.')

      compileTemplateToIos(input)
      expect(errorFn).toHaveBeenCalledWith('wx:else used on element [text] without corresponding wx:if or wx:elif.')
    })

    it('should throw error when elif used after else', function () {
      const input = `
        <view>
          <text wx:if="{{condition1}}">1</text>
          <text wx:else>2</text>
          <text wx:elif="{{condition2}}">3</text>
        </view>
      `
      compileTemplateToWx(input)
      expect(errorFn).toHaveBeenCalledWith('wx:elif="{{condition2}}" used on element [text] without corresponding wx:if or wx:elif.')

      compileTemplateToIos(input)
      expect(errorFn).toHaveBeenCalledWith('wx:elif="{{condition2}}" used on element [text] without corresponding wx:if or wx:elif.')
    })
  })
})
