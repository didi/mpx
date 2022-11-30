# E2E自动化测试

微信小程序的官方文档推荐 [miniprogram-automator](https://developers.weixin.qq.com/miniprogram/dev/devtools/auto/quick-start.html)，其与小程序IDE的关系，正如 Google 与 UiAutomator、selenium 与 webdriver 一样；它是最契合小程序的。

虽然微信小程序提供了 automator + ide 的 E2E 的解决方案，但该项目维护频率低且 case 编写效率低、API 不够友好等问题，所以基于 Mpx 生态，我们提供了小程序 E2E 自动化测试的能力增强。

小程序自动化 SDK 为开发者提供了一套通过外部脚本操控小程序的方案，从而实现小程序自动化测试的目的。

> 如果你之前使用过 Selenium WebDriver 或者 Puppeteer，那你可以很容易快速上手。小程序自动化 SDK 与它们的工作原理是类似的，主要区别在于控制对象由浏览器换成了小程序。


## 一、@mpx/cli 脚手架集成E2E

当使用 @mpxjs/cli 初始化 Mpx 项目的时候，交互式命令行里面新增了 E2E 选项，当选择了此选项，项目将会初始化 E2E 配置，完成相关内容的生成。

![](https://gift-static.hongyibo.com.cn/static/kfpub/3547/mpxtemplate.png)

关于 E2E 的模板文件如下：
```
# 忽略部分文件夹
vue-project
├─ .e2erc.js # E2E配置
├─ src
│  ├─ app.mpx
│  ├─ pages
│  │  └─ index.png
│  └─ components
│     └─ list.mpx
├─ test
│  └─ e2e # case目录
│     └─ list.spec.js # 示例文件
├─ jest-e2e.config.js # Jest配置
└─ package.json
```
这里罗列了 E2E 项目中约定(或推荐)的目录结构，在项目开发中，请遵照这个目录结构组织代码。

### 文件说明

**package.json**

使用自动化测试，我们要做的第一件事就是安装 @mpxjs/e2e 和 @mpxjs/e2e-scripts，然后我们需要在 package.json 中定义两个自动化测试的脚本 test 和 testServer。
```json
{
  "devDependencies": {
    "@mpxjs/e2e": "0.0.12",
    "@mpxjs/e2e-scripts": "0.0.10",
  }
  "scripts": {
    "test": "e2e-runner",
    "testServer": "e2e-runner --preview"
  }
}
```
小程序自动化 SDK 为开发者提供了一套通过外部脚本操控小程序的方案，从而实现小程序自动化测试的目的。

**.e2erc.js**

E2E 配置文件，包含 E2E 内置功能和插件的配置。可以在这里扩展运行时的能力，比如修改运行时是否自动保存页面快照。
```js
const path = require('path');
const PluginReport = require('@mpxjs/e2e/report-server/server.js');
module.exports = {
  recordsDir: 'dist/wx/minitest', // 录制 json 文件的存储目录
  connectFirst: false, // 优先使用 automator.connect，默认 automator.launch 优先
  defaultWaitFor: 5000, // 默认 waitFor 时长
  devServer: { // 测试报告服务器配置
    open: true,
    port: 8886
  },
  jestTimeout: 990000, // jestTimeout
  jsonCaseCpDir: 'test/e2e/e2e-json', // 从 minitest 目录复制 json 文件到该目录下
  needRealMachine: false, // 是否需要真机
  plugins: [new PluginReport()], // 自定义测试报告的插件
  projectPath: path.resolve(__dirname, './dist/wx'),
  sequence: [ // e2e 的 case 的执行顺序
    // 'minitest-1'
  ],
  testSuitsDir: 'test/e2e/', // e2e 的 case 存放目录
  useTS: false, // e2e 的 case 是否为 TS 语法
  wsEndpoint: 'ws://localhost:9420', // automator.connect 的 wsEndpoint
  timeoutSave: 3000, // 定时截图默认开启，设置为 false 即可关闭
  cacheDirectory: path.resolve(__dirname, './node_modules/@mpxjs/e2e/report-server/cache'), // 配置截图数据的保存目录
  tapSave: true, // 点击截图默认开启，设置为 false 即可关闭
  routeUpdateSave: true, // 路由切换截图默认开启，设置为 false 即可关闭
  routeTime: 300, // 路由切换 300ms 后再截图
  watchResponse: [ { url: '/api/list', handler (newRes, oldRes) { return true }} ], // 配置接口请求截图
}
```

我们提供了丰富的配置化选项，满足各种场景运行。

| 参数 | 类型 | 默认值 | 说明 |
| - | - | - | - |
| projectPath | String | ./dist/wx | 小程序代码路径，Mpx 框架的 wx 输出目录 |
| projectPath | String | test/e2e/suits/ | e2e 的 case 存放目录 |
| sequence | string[ ] | [ ] | 用例运行的顺序 |
| recordsDir | String | dist/wx/minitest | 录制 json 文件的存储目录 |
| connectFirst | Boolean | false | 优先使用 automator 的 connect 方法 |
| wsEndpoint | String | ws://localhost:9420 | 使用 connect 方式时的 wsEndpoint 选项 |
| defaultWaitFor | Number | 15000 | 默认 waitFor 时长 |
| useTS | Boolean | false | 用例是否为 TS 语法 |
| jestTimeout | Number | 990000 |  默认测试超时时间 |
| jsonCaseCpDir | String | 'test/e2e-json' |  从 minitest 目录复制 json 文件到该目录下 |
| needRealMachine | Boolean | false | 是否需要真机回放 |
| devServer | Object | null | 测试报告服务器配置 |
| plugins | Array | [ ] | 自定义测试报告的插件 |
| timeoutSave | Number | 3000 | 定时3000ms保存页面快照 |
| cacheDirectory | String | report-server/cache | 页面快照的保存目录 |
| tapSave | Boolean | true | 点击时候保存页面快照 |
| routeUpdateSave | Boolean | true | 路由切换时候保存页面快照 |
| routeTime | Number | 300 | 路由切换300ms后保存页面快照 |
| watchResponse | Object | null | 监听接口请求保存页面快照 |




**e2e**

e2e 目录，所有的 case 文件存放在此目录下，默认会创建一个演示 demo 文件，也就是 list.spec.js 文件，约定 e2e 下所有的 .spec.js 结尾的作为自动化测试的文件，使用 Typescript 编写测试文件的时, 需要将文件名改成 .spec.ts 格式，然后 tsconfig.json 加上 "esModuleInterop": true。
```js
/**
 * @file e2e test example
 * 首先开启工具安全设置中的 CLI/HTTP 调用功能
 * docs of miniprogram-automator: https://developers.weixin.qq.com/miniprogram/dev/devtools/auto/quick-start.html
 */
import automator from '@mpxjs/e2e'

describe('index', () => {
  let miniProgram
  let page

  beforeAll(async () => {
    try {
      miniProgram = await automator.connect({ wsEndpoint: 'ws://localhost:9420' })
    } catch (e) {
      miniProgram = await automator.launch({ projectPath: './dist/wx' })
    }
    page = await miniProgram.reLaunch('/pages/index')
    await page.waitFor(500)
  }, 30000)

  it('desc', async () => {
    const desc = await page.$('list', 'components/list2271575d/index')
    // 断言页面标签
    expect(desc.tagName).toBe('view')
    // 断言文字内容
    expect(await desc.text()).toContain('手机')
    // 保存页面快照
    await miniProgram.screenshot({
      path: 'test/e2e/screenshot/homePage.png'
    })
  })

  afterAll(async () => {
    await miniProgram.close()
  })
})
```
如果你已经熟悉了 Jest，你应该很适应 Jest 的断言 API。

**jest-e2e.config.js**

Jest 配置文件，这些选项可让你控制 Jest 的行为，你可以了解 Jest 的默认选项，以便在必要时扩展它们：
```js
module.exports = {
  preset: 'ts-jest',
  testEnvironment: 'node',
  testTimeout: 1000000000,
  maxWorkers: 1,
  reporters: [
    'default',
    ['<rootDir>/node_modules/@mpxjs/e2e/report-server/report.js', {}], // 自定义测试报告
  ]
}
```
除了 Jest 提供的默认测试报告器外，我们还可以自定义测试报告。框架 @mpxjs/e2e 内部提供了可视化测试报告平台，需要配置 reporters 字段。

## 二、@mpxjs/e2e-scripts

默认情况下，Jest 将会递归的找到整个工程里所有 .spec.js 或 .test.js 扩展名的文件。 Jest 支持并行运行 test ，特别是在 ci 场景，将会极大减少 test 消耗时间。配置 --maxWorkers 参数表示的是 Jest 会开启多少个线程去完成所有的测试任务，默认值是 50% * os.cpus().length，相关的文档可见：[链接](https://jestjs.io/docs/cli#--maxworkersnumstring)。 

合理的设置 maxWorkers 会使得运行变快，依赖的是并行跑用例，但是在自动化测试环境下，用例通过脚本操控模拟器或真机环境，多个用例不能同时操控一个环境，否则会相互干扰，就好比 JS 只能是单线程执行一样。

因为用例只能一个一个的执行，一个完整的项目自然会包含很多用例，但是一次只能执行一个用例的话，我们需要人工的操作很多次，才能全部执行完。为了跑一个遍就把所有的用例都执行完的话，我们会想到写一个脚本通过遍历的方式依次执行，这就是 @mpxjs/e2e-scripts 设计的初衷。

使用 @mpxjs/e2e-scripts 内部提供的命令脚本，执行 npx e2e-runner 将会按照 sequence 的定义的顺序依次执行用例文件。

```js
module.exports = {
  sequence: [ // 测试用例的执行顺序
    'minitest-1',
    'minitest-2'
  ]
}
```

上面代码表示会先执行 minitest-1.spec.js 文件，然后再执行 minitest-2.spec.js 文件。


## E2E可视化报告平台
E2E内置的 Jest 默认支持输出 HTML 的报告，因其只支持对测试结果数据的简单展示，故我们希望在其基础上，不仅针对报告查看的广度和颗粒度进行细化，还将对自动化测试过程中涉及到的痛点实现功能上的增强。

![](https://gift-static.hongyibo.com.cn/static/kfpub/8498/baogao-1.png)
![](https://gift-static.hongyibo.com.cn/static/kfpub/8498/jietu-1.png)

E2E可视化报告平台是一个运行在本地环境，统合了用例管理、测试报告、页面快照和错误日志的平台。支持对通过 WechatDevTools 录制回放功能录制出的 case 进行自定义增强的能力，同时提供执行 E2E 测试过程中产出的页面快照和错误日志等信息进行快捷、直观地查看的功能。

目前支持多种交互动作保存快照（点击、输入、滑动等），我们还在页面快照方面做了增强，提供了快照标记的功能，可以完善测试报告，增强排查手段，如上图所示，当点击元素后，页面快照上会自动标记出点击的区域或者元素。


## E2E录制+自动化生成case

微信推出了官方的录制回放能力。通过微信开发者工具可以录制用户的操作过程，期间可以进行简单断言，录制结束后支持回放。但是经过实际使用发现录制回放存在下列不足：

1. 录制结果结果以 json 形式存在于 dist 目录，难以扩展、难维护；
2. 仅支持 data快照、wxml快照、检查元素、检查路径四种简单断言，难以满足复杂业务场景的细粒度断言诉求；
3. 因等待时长、接口响应时机、组件更新时机等难以和录制时对应，录制结果回放失败频率高、不稳定；


我们通过基于微信原生的录制进行增强的方案。使用录制的便捷性降低手写流程的成本，再通过 sdk 的能力对录制所得 Case 进行增强。

这样，我们通过分析录制 JSON 文件，把 JSON 中的每一条进行分析转换，最终得到 spec 的 JS 代码文件，通过这种方式，可以大幅度降低获取元素、触发事件等常规 Case 的编写。

JSON to Spec 本质只是录制结果的一种呈现，而这种转换的目的在于通过扩展强化录制 Case，弥补录制的能力有限。

为了方便我们进行扩展，首先需要对录制所得的 JSON 文件进行语义化的分析。这么做的意义在于把录制的操作步骤和 JSON 的数据关联起来，而关联步骤和数据又可以增强可读性为用户在某一个步骤之后进行扩展增加了极大的便利性。

上一个部分已经论证过把录制和SDK增强接合起来的可行性，但是上面一系列的操作都是通过脚本的形式呈现的，这对于我们前面的降低门槛来说仍然是繁琐的。最起码对于不会写代码的的人来说，还是不够理想。接下来就是探索如何更直观、更高效的方式把这种方案落地。

我们设计了 Mpx-E2E 的工作台，当然这些也都集成到了 Mpx-E2E 的可视化平台中，下面我们看看这些具体的可视化的工作。

![](https://gift-static.hongyibo.com.cn/static/kfpub/2915/yuyihua.png)

分析 JSON 操作步骤后，我们把依据 JSON 生成的 Spec 同样做了可视化处理，起初的时候我们只是做了 Spec 代码的 highlight，并没有支持编辑。但是考虑到所见即所得的效率，我们又在此支持了 WEB-IDE。在生成 Spec 代码后，即可在线进行编辑，点击保存即可得到 spec 文件。

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

流程；并通过快照/截图比对进行结果判断；以及完善测试报告的可视化呈现。
