const templateLoader = require('../../../../lib/react/template-loader')
const compiler = require('../../../../lib/template-compiler/compiler')
const { genNode: genNodeReact } = require('../../../../lib/template-compiler/gen-node-react')

describe('RN template support', () => {
  const mockMpx = {
    mode: 'ios',
    srcMode: 'wx',
    defs: {},
    projectRoot: '/project',
    wxsContentMap: {},
    externalClasses: ['custom-class', 'i-class'],
    getModuleId: jest.fn(() => 'm123')
  }
  const mockContext = {
    resource: '/test.wxml',
    getMpx: () => mockMpx,
    emitWarning: jest.fn(),
    emitError: jest.fn()
  }

  beforeEach(() => {
    mockContext.emitWarning.mockClear()
    mockContext.emitError.mockClear()
    mockMpx.wxsContentMap = {}
  })

  it('should generate correct code for template import and definition', () => {
    const input = `
      <import src="./other.wxml" />
      <template name="foo">
        <view>foo</view>
      </template>
    `
    const output = templateLoader.call(mockContext, input)

    // Check imports
    expect(output).toContain('require("!!')
    expect(output).toContain('template-loader!./other.wxml")')

    expect(mockContext.emitError).toHaveBeenCalledTimes(0)
    expect(output).toMatch(/"foo":\s*\(\s*function\s*\(createElement,\s*getComponent\)\s*\{/)
    expect(output).toContain('getComponent("mpx-view")')

    // Check module structure
    expect(output).toContain('var templates = Object.assign({}, require("!!')
    expect(output).toContain('Object.assign(templates, localTemplates)')
    expect(output).toContain('module.exports = localTemplates')
  })

  it('should generate correct code for template usage inside template', () => {
    const input = `
      <template name="bar">
        <template is="foo" data="{{...d}}" />
      </template>
    `
    const output = templateLoader.call(mockContext, input)

    expect(mockContext.emitError).toHaveBeenCalledTimes(0)
    expect(output).toMatch(/getTemplate\("foo"\)\.call\(Object\.assign\(Object\.create\(this\),[\s\S]+\), createElement, getComponent\)/)
    expect(output).toMatch(/"bar":\s*\(\s*function\s*\(createElement,\s*getComponent\)\s*\{/)
  })

  it('should process conditional branches inside template definition', () => {
    const input = `
      <template name="cond">
        <view wx:if="{{ok}}">a</view>
        <view wx:else>b</view>
      </template>
    `
    const output = templateLoader.call(mockContext, input)

    expect(mockContext.emitError).toHaveBeenCalledTimes(0)
    expect(output).toMatch(/"cond":\s*\(\s*function\s*\(createElement,\s*getComponent\)\s*\{/)
    expect(output).toMatch(/this\.ok\s*\?/)
    expect(output).toMatch(/:\s*createElement\(/)
  })

  it('should process wx if-elseif-else and wx for inside template definition', () => {
    const input = `
      <template name="directive-demo">
        <view wx:if="{{a}}">a</view>
        <view wx:elif="{{b}}">b</view>
        <view wx:else>c</view>
        <view wx:for="{{list}}" wx:for-item="item" wx:for-index="idx">{{item.text}}</view>
      </template>
    `
    const output = templateLoader.call(mockContext, input)

    expect(mockContext.emitError).toHaveBeenCalledTimes(0)
    expect(output).toMatch(/"directive-demo":\s*\(\s*function\s*\(createElement,\s*getComponent\)\s*\{/)
    expect(output).toMatch(/this\.a\s*\?/)
    expect(output).toMatch(/this\.b\s*\?/)
    expect(output).toContain('this.__iter(')
    expect(output).toContain('function (item, idx)')
  })

  it('should inject built-in component map in template loader runtime output', () => {
    const input = `
      <template name="with-builtin">
        <movable-view>content</movable-view>
      </template>
    `
    const output = templateLoader.call(mockContext, input)
    expect(mockContext.emitError).toHaveBeenCalledTimes(0)
    expect(output).toContain('getBuiltInBaseComponent')
    expect(output).toContain('__mpxBuiltIn: true')
    expect(output).toContain('"mpx-movable-view": function')
  })

  it('should report error for template usage without valid is value', () => {
    const input = '<template is="" data="{{...d}}" />'
    templateLoader.call(mockContext, input)
    expect(mockContext.emitError).toHaveBeenCalledTimes(1)
    expect(mockContext.emitError.mock.calls[0][0].message).toContain('valid is or name attr')
  })

  it('should report error for template tag without is and name', () => {
    const input = '<template data="{{...d}}" />'
    templateLoader.call(mockContext, input)
    expect(mockContext.emitError).toHaveBeenCalledTimes(1)
    expect(mockContext.emitError.mock.calls[0][0].message).toContain('valid is or name attr')
  })

  it('should generate correct code for template usage in regular render', () => {
    const input = '<template is="foo" data="{{...d}}" />'
    const parsed = compiler.parse(input, {
      mode: 'ios',
      srcMode: 'wx',
      defs: {},
      usingComponentsInfo: {},
      filePath: 'test.mpx',
      warn: console.warn,
      error: console.error
    })
    const output = genNodeReact(parsed.root)
    expect(output).toMatch(/getTemplate\("foo"\)\.call\(Object\.assign\(Object\.create\(this\), .+\), createElement, getComponent\)/)
  })

  it('should support using registered components from host', () => {
    const input = `
      <template name="comp-demo">
        <custom-comp>content</custom-comp>
      </template>
    `
    const output = templateLoader.call(mockContext, input)
    // Verify that getComponent is used for custom-comp, which will be resolved at runtime by the host component's getComponent
    expect(mockContext.emitError).toHaveBeenCalledTimes(0)
    expect(output).toContain('createElement(getComponent("custom-comp"), null, createElement(getComponent("mpx-inline-text"), null, "content"))')
  })

  it('should handle wxs in sub template', () => {
    const input = `
      <wxs module="m1" src="./test.wxs"></wxs>
      <wxs module="m2">
        var a = 1;
        module.exports = { a: a };
      </wxs>
      <template name="wxs-demo">
        <view>{{m1.xxx}}</view>
        <view>{{m2.a}}</view>
      </template>
    `
    const output = templateLoader.call(mockContext, input)
    expect(mockContext.emitError).toHaveBeenCalledTimes(0)

    // Check wxs imports generation
    expect(output).toContain('var m1 = require(')
    expect(output).toContain('var m2 = require(')

    // Check wxsContentMap merging with rawResourcePath prefix
    // mockContext.resource is '/test.wxml'
    expect(mockMpx.wxsContentMap['/test.wxml~m2']).toBeDefined()
    expect(mockMpx.wxsContentMap['/test.wxml~m2']).toContain('var a = 1;')
  })
})
