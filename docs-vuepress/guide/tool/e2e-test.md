# E2E自动化测试

微信小程序的官方文档推荐 [miniprogram-automator](https://developers.weixin.qq.com/miniprogram/dev/devtools/auto/quick-start.html)，其与小程序IDE的关系，正如 Google 与 UiAutomator、selenium 与 webdriver 一样；它是最契合小程序的。

虽然微信小程序提供了 automator + ide 的 E2E 的解决方案，但该项目维护频率低且 case 编写效率低、API 不够友好等问题，所以基于 Mpx 生态，我们提供了小程序 E2E 自动化测试的能力增强。

小程序自动化 SDK 为开发者提供了一套通过外部脚本操控小程序的方案，从而实现小程序自动化测试的目的。

> 如果你之前使用过 Selenium WebDriver 或者 Puppeteer，那你可以很容易快速上手。小程序自动化 SDK 与它们的工作原理是类似的，主要区别在于控制对象由浏览器换成了小程序。

如果是初始化项目，自动化测试相关的项目依赖和配置可以通过 @mpx/cli 创建项目时选择使用 E2E 测试选项自动生成，如果时旧项目需要使用，可以按照下方步骤安装依赖和添加配置。



## 安装依赖
```html
npm i -D miniprogram-automator jest @types/jest @mpxjs/e2e @mpxjs/e2e-scripts

// 如果项目使用了ts，则还需要安装
npm i -D ts-jest
```
## jest 相关配置

首先在项目根目录创建 jest.config.js 配置文件，并加入以下关键配置：

```html
module.exports = {
  preset: 'ts-jest',
  testEnvironment: 'node',
  testTimeout: 1000000000
}
```

在 package.json 加入以下关键配置：
```js
<script>
  "test:e2e": "npx e2e-runner"
  ...
</script>
```
@mpxjs/e2e-scripts 提供 e2e 测试中需要的命令脚本，为了串行执行 spec 文件特别提供了 `e2e-runner` 命令。

关于环境配置，请确保小程序模拟器打开服务端口，如图

![](https://gift-static.hongyibo.com.cn/static/kfpub/3547/image2022-2-24_14-20-36.png)

## 简单的断言

暂时进行一个简单的组件单元测试书写，对于复杂组件以及通用测试逻辑的总结我们会在后续进行发布。

示例如下：
```html
<template>
  <view class="list">
    <view wx:for="{{listData}}" wx:key="index">{{item}}</view>
  </view>
</template>

<script lang="ts">
  import { createComponent } from '@mpxjs/core'

  createComponent({
    data: {
      listData: ['手机', '电视', '电脑']
    }
  })
</script>

<style lang="stylus">
  .list
    background-color red
</style>

<script type="application/json">
  {
    "component": true
  }
</script>
```

对应的 list.spec.js 
```js
import automator from '@didi/e2e-extension'
const path = require('path')

describe('index', () => {
  let miniProgram
  let page

  beforeAll(async () => {
    miniProgram = await automator.launch({
      projectPath: path.resolve(__dirname, '../../dist/wx')
    })
    page = await miniProgram.reLaunch('/pages/index')
    await page.waitFor(500)
  }, 30000)

  it('desc', async () => {
    const desc = await page.$('list', 'components/list2271575d/index')
    expect(desc.tagName).toBe('view')
    expect(await desc.text()).toContain('手机')
  })

  afterAll(async () => {
    await miniProgram.close()
  })
})
```
小程序视图层的更新是异步的，一些依赖视图更新结果的断言必须 page.waitFor() 后进行。关于 SDK 提供的接口，更多详细用法可以参阅 [Automator](https://developers.weixin.qq.com/miniprogram/dev/devtools/auto/automator.html)、[MiniProgram](https://developers.weixin.qq.com/miniprogram/dev/devtools/auto/miniprogram.html)、[Page](https://developers.weixin.qq.com/miniprogram/dev/devtools/auto/page.html)、[Element](https://developers.weixin.qq.com/miniprogram/dev/devtools/auto/element.html)。

## 增强API

1、获取页面中的DOM元素 $ 方法 ：

SDK 中重写 page 和 element 的 `$` 方法。之所以这么处理是因为原生的 `$` 方法存在自定义组件中的元素不能稳定获取的问题，而这个问题的根源在于微信小程序会以某种规则为元素拼接组件或者父组件的名字作为真实类名，而这种规则并不固定。

目前增强后的 `$` 方法支持两个参数，第一个为选择器，第二个是自定义组件名。第二个参数不传时其行为和原生 `$` 方法一致。
```js
$(className: string, componentsName?: string): Promise<Element | any>
 
const confirmbtn = await page.$('confirm-btn', 'homepage/components/confirmef91faba/confirm')
 
const confirmbtn2 = await page.$('.confirm-btn')
const view = await page.$('view')
const id = await page.$('#id')
```
获取自定义组件中的元素需要以渲染结果为准，通常第二个参数是传入组件的 `is` 属性。注意弹窗类似的组件往往会存在动画所以需要异步获取。
```js
// 页面的渲染结果
<base-dialog is="homepage/components/dialogd2d0cea6/index">
  #shadow-root
    <view class="wrapper">
      <view class="cancel-btn">确认</view>
      <view class="confirm-btn">取消</view>
    </view>
</base-dialog>

// 对应获取元素的方法
const cancelbtn = await page.$('confirm-btn', 'homepage/components/dialogd2d0cea6/index')
const confirmbtn = await page.$('confirm-btn', 'homepage/components/dialogd2d0cea6/index')
```

2、增强 wait/ waitAll

automator 中原生支持 `wait` 方法，表示等待时长或者等待终止的断言函数。但是经过实际测试发现，使用指定的等待时间并不可靠，其运行受限于硬件条件。

经过增强的 `wait` 方法可以支持： 路由到指定页面， 指定组件渲染，指定组件更新，指定接口发起， 指定接口响应后；
```js
wait(path: string, type?: string): Promise<string | undefined> | void;
 
const miniProgram = await Automator.launch({
  projectPath: './dist/wx'
})

// 页面
page = await miniProgram.reLaunch('/pages/index/index')
await miniProgram.wait('pages/index/index')

// 组件
const suggest1 = await miniProgram.wait('suggest/components/suggestcaafe3e4/suggest', 'component')
 
// 组件更新
const suggest2 = await miniProgram.wait('suggest/components/suggestcaafe3e4/suggest', 'componentUpdate')
 
// 请求
const request = await miniProgram.wait('https://xxxx.xxx/xxx', 'request')
 
// 返回结果
const response = await miniProgram.wait('https://xxxx.xxx/xxx', 'response')
expect(response.options.data.errno).toBe(0)
const data = response.options.data.data
expect(data.status).toBe(1)
```

3、新增 mock 能力

考虑到进行 e2e 测试时有些场景需要 mock 数据，所以 SDK 结合 mpx-fetch 的 `setProxy` 能力提供了静态资源文件 mock、手动设置接口响应结果的能力。

前置：如果需要使用 mock 需要使用支持 `setProxy` 的 mpx-fetch 版本；此外还需要在 createApp 的时候传入 `setProxy` 属性，其配置与 mpx-fetch 的 `setProxy` 方法的配置相同，示例：
```js
createApp({
	setProxy: [
  	{
    	test: {
      	host: 'some-domain.com',
      	protocol: 'https:'
    	},
    	proxy: {
      	host: 'localhost',
      	port: 8887,
      	protocol: 'http:'
    	}
  	}
  ],
	// otherApp props
})
```

3.1 初始化 mock：initMock

当传入 `staticDir` 时会优先匹配该目录下的静 json 文件作为指定接口的响应结果。

接口与文件名的映射规则：将域名后的 path 中的分隔符 `/` 替换为 `-`，示例：

- 接口名称：`api/pGetIndexInfo`
- json 文件名称：`api-pGetIndexInfo.json`

```js
interface E2eMockConfig {
  staticDir: string // 本地文件目录：
}

Automator.initMock(mockCfg: E2eMockConfig): Promise<MiniProgram>
```

3.2 `setMock` 方法，除了上面的静态资源文件，mock 内置了一个 Map 列表，因此可以按需的设置某一接口的响应结果。
```js
Automator.setMock (path:string, response:any): () => void
 
// 示例：
let un = Automator.setMock('https://some-domain.com/api/pGetIndexInfo', {
  errno: 0,
  errmsg: 'mock-index-info',
  data: {
    a: 1,
    b: 2,
    c: 3
  }
});
 
// 需要取消时可以调用 un，注意这一步骤非必须！！
un();
```
3.3 `removeMockFromMap` 从 mock 内置的 Map 列表中移除指定 path 对应的的 mock 数据。

```js
Automator.removeMockFromMap (path:string): void
```

## E2E runner

提供 E2E 测试中需要的命令脚本：执行命令 `e2e-runner`

主要用与复杂的业务体系，给开发同学提供自行组织case串行执行顺序的能力
> 注意这个命令不支持全局调用

执行该命令需要在小程序项目根目录下执行，另外此目录要求存在 `.e2erc.js` 配置文件，配置文件形如：

```javascript
module.exports = {
  sequence: [ // spec 文件执行顺序
    'aTob',
    'bToc',
  ],
  reportsDir: 'test/reports', // 测试报告存放文件夹
  testSuitsDir: 'test/e2e/suits/', // spec 文件存放目录
  record: true // 是否需要记录运行时间日志，为 true 时会在项目目录中创建 e2e-record.txt 文件
}

```
调用
```shell script
npx e2e-runner
```

微信对于小程序自动化测试能力也在不断增强，我们会不断基于微信的基础能力去完善MPX E2E, 比如结合WX导出的用例json转成可执行spec，
持续增强断言能力；通过支持录制/回放稳定运行自动化流程；并通过快照/截图比对进行结果判断；以及完善测试报告的可视化呈现。
