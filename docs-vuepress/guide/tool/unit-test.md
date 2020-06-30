# 单元测试

Mpx会生成源码与最终产物包的映射关系，结合微信小程序提供的 [miniprogram-simulate](https://github.com/wechat-miniprogram/miniprogram-simulate) 来进行单元测试的工作。

> 因为目前仅微信提供了仿真工具，暂时只支持微信小程序平台的单元测试。如果需要E2E测试，则和框架无关了，可参考微信的[小程序自动化](https://developers.weixin.qq.com/miniprogram/dev/devtools/auto/)。

## 简单的断言

组件必须是被项目真实使用的，且经过一次构建才可被测试。构建时 MpxPlugin 的配置信息中要将 [generateBuildMap](../../api/compile.md#generatebuildmap) 属性置为 `true` 来生成源码与最终代码的映射关系。

```html
<template>
  <view>{{ message }}</view>
</template>

<script>
  import {createComponent} from '@mpxjs/core'
  createComponent({
    data: {
      message: 'hello!'
    },
    attached () {
      this.message = 'bye!'
    }
  })
</script>
```

然后通过辅助方法读取 dist/outputMap.json 以获取源码最终生成的组件dist的路径，再配合 [miniprogram-simulate](https://github.com/wechat-miniprogram/miniprogram-simulate) 进行测试。你可以使用许多常见的断言 (这里我们使用的是 Jest 风格的 expect 断言作为示例)：

```js
const simulate = require('miniprogram-simulate')

function resolveDist (dir) {
  return path.join(__dirname, '../dist/wx', dir)
}
// 辅助方法，通过源码获取最终的dist路径，让simulate工具以正确load
function loadComponent (componentPathStr) {
  const outputMap = require(resolveDist('../outputMap.json'))
  const componentPath = resolve(componentPathStr)
  const realComponentPath = resolveDist(outputMap[componentPath])
  return simulate.load(realComponentPath, undefined, {rootPath: resolveDist('')})
}

// 这里是一些 Jasmine 2.0 的测试，你也可以使用你喜欢的任何断言库或测试工具。
describe('MyComponent', () => {
  let id
  beforeAll(() => {
    id = loadComponent('src/components/hello-world.mpx')
  })

  // 检查 mount 中的组件实例
  it('correctly sets the message when component attached', () => {
    const comp = simulate.render(id)
    const instance = comp.instance
    
    // Mpx提供的数据响应是发生在组件挂载时的，未挂载前只能通过实例上的data访问数据
    expect(instance.data.message).toBe('hello!')
    
    const parent = document.createElement('parent-wrapper') // 创建容器节点
    comp.attach(parent) // 将组件插入到容器节点中，会触发 attached 生命周期
    // 挂载后则可以直接通过实例访问
    expect(instance.message).toBe('bye!')
  })

  // 创建一个实例并检查渲染输出
  it('renders the correct message', () => {
    const comp = simulate.render(id)
    const parent = document.createElement('parent-wrapper') // 创建容器节点
    comp.attach(parent) // 挂载组件到容器节点
    expect(comp.dom.innerHTML).toBe('<wx-view>bye!</wx-view>')
  })
})
```

