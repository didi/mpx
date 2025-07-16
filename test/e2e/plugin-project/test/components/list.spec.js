/**
 * @file unit test example
 * docs of miniprogram-simulate: https://github.com/wechat-miniprogram/miniprogram-simulate
 */
const simulate = require('@mpxjs/miniprogram-simulate')

describe('test list component', () => {
  beforeEach(() => {
    simulate.mockComponent('mp-view', {
      template: '<view>mp-view</view>'
    })
  })
  it('components instance data', function () {
    const id = simulate.loadMpx('mini-project-plugin/components/list.mpx')
    const comp = simulate.render(id)
    expect(comp.data.listData.length).toBe(3)
    expect(comp.data.listData).toEqual(['手机', '电视', '电脑'])
  })
  it('should render list correct', function () {
    const id = simulate.loadMpx('mini-project-plugin/components/list.mpx')
    const comp = simulate.render(id) // 渲染自定义组件
    const parent = document.createElement('parent-wrapper') // 创建容器节点
    comp.attach(parent) // 将组件插入到容器节点中，会触发 attached 生命周期
    expect(comp.dom.innerHTML).toBeDefined() // 判断组件渲染结果
    // 执行其他的一些测试逻辑
  })
})
