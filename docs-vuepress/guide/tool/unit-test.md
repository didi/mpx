todo 更新单元测试章节 @薛干

# 单元测试

Mpx 框架提供了 jest 转换器 mpx-jest，结合微信小程序提供的 [miniprogram-simulate](https://github.com/wechat-miniprogram/miniprogram-simulate) 来进行单元测试的工作。

> 因为目前仅微信提供了仿真工具，暂时只支持微信小程序平台的单元测试。如果需要 E2E 测试，则和框架无关了，可参考微信的[小程序自动化](https://developers.weixin.qq.com/miniprogram/dev/devtools/auto/)。

如果是初始化项目，单元测试相关的项目依赖和配置可以通过 @mpx/cli 创建项目时选择使用单元测试选项自动生成，如果时旧项目需要使用，可以按照下方步骤安装依赖和添加配置。

## 安装依赖
```html
npm i -D @mpxjs/mpx-jest @mpxjs/miniprogram-simulate jest babel-jest

// 如果项目使用了ts，则还需要安装
npm i -D ts-jest
```
## jest 相关配置
首先在项目根目录创建 jest.config.js 配置文件



## 简单的断言

组件必须是被项目真实使用的。构建时 MpxPlugin 的配置信息中要将 [generateBuildMap](../../api/compile.md#generatebuildmap) 属性置为 `true` 来生成源码与最终代码的映射关系。

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

## 编写可被测试的组件

很多组件的渲染输出由它的 props 决定。事实上，如果一个组件的渲染输出完全取决于它的 props，那么它会让测试变得简单，就好像断言不同参数的纯函数的返回值。看下面这个例子：

```html
<template>
  <view>{{ msg }}</view>
</template>

<script>
  import {createComponent} from '@mpxjs/core'
  createComponent({
    properties: { msg: String }
  })
</script>
```

你可以在不同的 properties 中，通过 simulate.render 的第二个参数控制组件的输出：

```js
const simulate = require('miniprogram-simulate')

// 省略辅助方法
describe('MyComponent', () => {
  it('renders correctly with different props', () => {
    const id = loadComponent('src/components/hello-world.mpx')
    const comp1 = simulate.render(id, { msg: 'hello' })
    const parent1 = document.createElement('parent-wrapper')
    comp1.attach(parent1)
    expect(comp1.dom.innerHTML).toBe('<wx-view>hello</wx-view>')
    
    const comp2 = simulate.render(id, { msg: 'bye' })
    const parent2 = document.createElement('parent-wrapper')
    comp2.attach(parent2)
    expect(comp2.dom.innerHTML).toBe('<wx-view>bye</wx-view>')
  })
})
```

## 断言异步更新

小程序视图层的更新是异步的，一些依赖视图更新结果的断言必须 await simulate.sleep() 后进行：

```js
const simulate = require('miniprogram-simulate')

// 省略辅助方法
it('updates the rendered message when vm.message updates', async () => {
  const id = loadComponent('src/components/hello-world.mpx')
  const comp = simulate.render(id)
  const parent = document.createElement('parent-wrapper')
  comp.attach(parent)
  comp.instance.msg = 'foo'
  await simulate.sleep(10)
  expect(comp.dom.innerHTML).toBe('<wx-view>foo</wx-view>')
})
```

更深入的 Mpx 单元测试的内容将在以后持续更新……
