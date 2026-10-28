const fs = require('fs')
const path = require('path')
const vm = require('vm')
const postcss = require('postcss')

const source = fs.readFileSync(path.join(__dirname, '../outputs/style-card.mpx'), 'utf8')
const script = source.match(/<script>([\s\S]*?)<\/script>/)[1]
const style = postcss.parse(source.match(/<style>([\s\S]*?)<\/style>/)[1])
const rules = {}
style.walkRules(rule => {
  if (rule.parent.type === 'root') {
    rule.selector.split(',').forEach(selector => {
      rules[selector.trim()] = Object.fromEntries(rule.nodes.filter(n => n.type === 'decl').map(n => [n.prop, n.value]))
    })
  }
})

function mount (renderer, windowWidth) {
  let options
  const wx = {
    getWindowInfo: jest.fn(() => ({ windowWidth })),
    onWindowResize: jest.fn(),
    offWindowResize: jest.fn()
  }
  vm.runInNewContext(script.replace(/import[^\n]+/, ''), { wx, createComponent: value => { options = value } })
  const instance = Object.assign({ renderer }, options.data)
  options.attached.call(instance)
  return { instance, options, wx }
}

describe('mock: Skyline 窗口状态和生命周期', () => {
  test.each([[319, true], [320, true], [321, false], [375, false]])('初始窗口 %i -> isSmall %s', (width, expected) => {
    const { instance, options, wx } = mount('skyline', width)
    expect(instance.isSmall).toBe(expected)
    expect(wx.onWindowResize).toHaveBeenCalledTimes(1)
    options.detached.call(instance)
    expect(wx.offWindowResize).toHaveBeenCalledWith(wx.onWindowResize.mock.calls[0][0])
  })
  test('窗口跨越断点并清理同一监听函数', () => {
    const { instance, options, wx } = mount('skyline', 375)
    const handler = wx.onWindowResize.mock.calls[0][0]
    ;[320, 321, 300, 400].forEach(width => {
      handler({ size: { windowWidth: width } })
      expect(instance.isSmall).toBe(width <= 320)
    })
    options.detached.call(instance)
    expect(wx.offWindowResize).toHaveBeenCalledTimes(1)
    expect(wx.offWindowResize).toHaveBeenCalledWith(handler)
  })
  test('WebView 使用原生媒体查询，无运行时监听', () => {
    const { instance, options, wx } = mount('webview', 320)
    options.detached.call(instance)
    expect(wx.getWindowInfo).not.toHaveBeenCalled()
    expect(wx.onWindowResize).not.toHaveBeenCalled()
    expect(wx.offWindowResize).not.toHaveBeenCalled()
  })
  test('不同实例的监听互相独立', () => {
    const a = mount('skyline', 320)
    const b = mount('skyline', 375)
    expect(a.instance.windowResizeHandler).not.toBe(b.instance.windowResizeHandler)
    a.options.detached.call(a.instance)
    b.instance.windowResizeHandler({ size: { windowWidth: 300 } })
    expect(b.instance.isSmall).toBe(true)
  })
})

describe('static: 业务约束与盒模型推导（非渲染测量）', () => {
  test('title 接口与双端单行省略', () => {
    const { options } = mount('webview', 375)
    expect(options.properties.title.type.name).toBe('String')
    expect(options.properties.title.value).toBe('本周精选商品')
    expect(source).toContain('max-lines="{{1}}" overflow="ellipsis">{{title}}</text>')
    expect(rules['.title']['text-overflow']).toBe('ellipsis')
    expect(rules['.title']['white-space']).toBe('nowrap')
  })
  test('媒体查询隔离，阈值与两端 padding 一致', () => {
    const media = style.nodes.find(n => n.type === 'atrule' && n.name === 'media')
    expect(media.params).toBe('screen and (max-width: 320px)')
    expect(media.nodes.map(n => n.selector)).toEqual(['.card-webview'])
    expect(media.nodes[0].nodes[0].value).toBe('12rpx')
    expect(rules['.card'].padding).toBe('24rpx')
    expect(rules['.card-small'].padding).toBe('12rpx')
    expect(source).toContain("'card-webview': renderer !== 'skyline'")
    expect(source).toContain("'card-small': renderer === 'skyline' && isSmall")
  })
  test('child 顶距和尺寸、相邻块16px、红色与等宽标签', () => {
    expect(rules['.outer']['padding-top']).toBe('20px')
    expect(rules['.child'].padding).toBe('10px')
    expect(rules['.child'].width).toBe('100px')
    expect(rules['.child']['box-sizing']).toBe('content-box')
    expect(rules['.child']['margin-top']).toBeUndefined()
    expect(20 + 10).toBe(30)
    expect(100 + 10 * 2).toBe(120)
    expect(rules['.first']['margin-bottom']).toBe('16px')
    expect(rules['.second']['margin-top']).toBe('0')
    expect(rules['.labels'].display).toBe('flex')
    expect(rules['.label'].width).toBe('50%')
    expect(rules['.badge-sale'].color).toBe('#d00')
  })
  test('负 margin 占位链与原WebView静态基线一致', () => {
    const originalHeight = 92 + 92
    const originalStart = originalHeight + Math.min(-28, -92)
    const branchHeight = originalHeight + parseFloat(rules['.tips-bar']['margin-bottom'])
    const adaptedStart = branchHeight + parseFloat(rules['.content-card']['margin-top'])
    expect(rules['.tips-wrapper'].display).toBe('flex')
    expect(rules['.overlap-host']['flex-direction']).toBe('column')
    expect(originalStart).toBe(92)
    expect(branchHeight).toBe(156)
    expect(adaptedStart).toBe(originalStart)
    expect(originalHeight - adaptedStart).toBe(92)
    expect(adaptedStart + parseFloat(rules['.content-card'].height)).toBe(212)
    expect(rules['.simple-overlap']).toBeUndefined()
    expect(rules['.simple-next']['margin-top']).toBe('-8rpx')
  })
  test('横向直接内容宽度铺满且两项各160px', () => {
    expect(source).toMatch(/scroll-x="\{\{true\}\}" enable-flex="\{\{true\}\}" type="custom"/)
    expect(rules['.fit-scroll'].width).toBe('320px')
    expect(rules['.fit-scroll']['flex-direction']).toBe('row')
    expect(rules['.fit-content'].width).toBe('100%')
    expect(rules['.fit-content'].background).toBe('#eef2f8')
    expect(rules['.fit-item'].width).toBe('50%')
    expect(rules['.fit-item']['flex-shrink']).toBe('0')
    expect(320 * parseFloat(rules['.fit-item'].width) / 100).toBe(160)
  })
  test('单rgba阴影保留、双阴影分层与滤镜顺序', () => {
    expect(rules['.single-shadow']['box-shadow']).toBe('0 2px 4px rgba(0,0,0,.2)')
    expect(rules['.single-filter'].filter).toBe('blur(2px)')
    expect(rules['.many']['box-shadow']).toBe('0 4px 8px #333')
    expect(rules['.many-front']['box-shadow']).toBe('0 2px 4px #000')
    expect(rules['.filters'].filter).toBe('brightness(.8)')
    expect(rules['.filters-blur'].filter).toBe('blur(2px)')
    expect(source).toContain('<view class="filters"><view class="filters-blur">复合滤镜</view></view>')
  })
  test('保留已确认字体设计', () => {
    expect(rules['.font-a']['font-family']).toBe("'City-Semibold'")
    expect(rules['.font-a']['font-weight']).toBe('600')
    expect(rules['.font-b']['font-family']).toBe("'Trip-Medium'")
    expect(rules['.font-b']['font-weight']).toBe('500')
  })
})
