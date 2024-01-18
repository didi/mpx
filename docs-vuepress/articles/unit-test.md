---
sidebarDepth: 2
---

# Mpx 小程序单元测试能力建设与实践
> 作者：[Blackgan3](https://github.com/Blackgan3)

## 什么是单元测试

In computer programming, unit testing is a software testing method by which individual units of source code—sets of one or more computer program modules together with associated control data, usage procedures, and operating procedures—are tested to determine whether they are fit for use wikipedia

对一个函数，模块，类进行运行结果正确性检验的工作就是单元测试，此外每个单元测试的对象应该是一个最简单的组件/函数。

那写单测又能给我们哪些收益呢？

- 大幅提高项目代码可维护性
- 覆盖率到达一定指标后可大幅提高研发效率
- 让你的代码零线上bug锐减，上线不再提心吊胆
- 改进设计，促进重构

此外，单测高覆盖率的项目也会给公司节省大量支出：
![unit-test-money.png](https://cdn.nlark.com/yuque/0/2021/png/116604/1640872105786-b7b230b4-7f65-4a0f-8dbf-e8ba89f61837.png#averageHue=%23fcfbfa&clientId=u39d6bb3b-719d-4&crop=0&crop=0&crop=1&crop=1&from=paste&height=577&id=u3d713c30&margin=%5Bobject%20Object%5D&name=unit-test-money.png&originHeight=1153&originWidth=2770&originalType=binary&ratio=1&rotation=0&showTitle=false&size=227658&status=done&style=none&taskId=u33caf2b6-ceb2-43ca-9da2-c631d845598&title=&width=1385)
据微软统计单测效益结果，如上图展示，绝大多数bug都是在coding阶段产生，并且随着需求开发进度的推进，修复bug的成本会随指数级增长，当我们在unit test阶段发现并修复这个bug是能给公司带来巨大收益的。

下方介绍两种常见的项目单元测试规范：

- TDD (Test driven development)

> 测试驱动开发，在书写业务代码之前，先根据需求进行单元功能测试用例书写


这里驱动开发的不是简单的测试用例，是能够持续验证、重构并且对需求功能极致细化的测试用例

- BDD (Behavior driven development)

> 行为驱动开发，通过具有辨识力的测试用例驱动项目开发团队所有人，使用自然语言来描述功能，一般和 TDD 相结合，针对行为进行测试，让开发者在写单测时从专注代码实现转为业务行为，能使单测更加场景化和智能化


单元测试的书写初期必定伴随着大量精力与时间的消耗，但长期持续维护的业务在搭建并完善好整个单元测试体系后，可大大提高项目稳定性和研发效率
## 前端单元测试
### 前端单元测试工具
前端单元测试目前有很多框架和工具，我们下方列出三个较为流行的框架和工具库进行介绍

- Mocha: 功能丰富的 javascript 测试框架(不包括断言和仿真环境，快照测试需额外配置)，可以运行在node.js和浏览器中
- Jasmine：Behavior-Drive development(BDD)风格的测试框架，在业内较为流行,功能很全面，自带asssert、mock功能
- Jest：一个功能全面的 javascript 测试框架，基于Jasmine 做了大量新特性(例如并行执行、源代码改动感知等)，开箱即用，适用于绝大多数 js 项目

### 测试断言库
在单测运行框架中，我们需要断言库来进行方法返回和实例状态的正确性验证

- should: BDD风格断言                    (true).should.be.ok
- expect: expect()样式断言              expect(true).toBe(true)
- assert: Node.js 内置断言模块       assert(true === true)
- chai: expect()，assert()和should风格的断言都支持，全能型选手

在众多前端单元测试框架中，Jest 目前凭借零配置，高性能，且对于断言，快照，覆盖率等都有很好的集成，是目前较为流行的一个单测框架
### Jest 框架简介
简单来看下 Jest 框架的特点以及大致的运行原理

**Jest 的整体框架特点大概归纳总结为以下几点:**

- 在操作系统上高效的进行文件搜索以及相互依赖关系匹配
- 单测并行执行，运行效率高
- 内置断言库、覆盖率、快照测试等功能，开箱可用
- 使用 vm 来进行沙盒环境运行，单测之间相互隔离

![image.png](https://cdn.nlark.com/yuque/0/2021/png/116604/1639153318989-0e6ac9ed-75a3-4874-8a48-5370db55891d.png#averageHue=%23464a4d&clientId=uf375a834-bd4b-4&crop=0&crop=0&crop=1&crop=1&from=paste&height=579&id=u7fb4026f&margin=%5Bobject%20Object%5D&name=image.png&originHeight=2014&originWidth=777&originalType=binary&ratio=1&rotation=0&showTitle=false&size=495531&status=done&style=none&taskId=u6e39efb8-e12a-49b0-b8ce-ade9b63fd2c&title=&width=223.5)
打开 Jest pacakges，可以看到大概有50多个包，我们根据这些不同的包来将整个 jest 运行流程整体串起来

**第一步 jest-cli 读取相关配置**
当我们执行 jest 命令时，先去执行 jest-cli 中的 run 方法，再调用 jest-core 中的 runCli 方法，其中通过 jest-config 提供的 readConfigs 来读取 Jest 相关配置，返回全局配置(globalConfig)和局部配置(configs)

![unit-test-jest-step1.png](https://cdn.nlark.com/yuque/0/2021/png/116604/1640502186276-2a1c2976-58a5-4fd9-91db-c5df8265fc7f.png#clientId=u3d4e127e-cc05-4&crop=0&crop=0&crop=1&crop=1&from=paste&height=161&id=uc6c948fd&margin=%5Bobject%20Object%5D&name=unit-test-jest-step1.png&originHeight=177&originWidth=808&originalType=binary&ratio=1&rotation=0&showTitle=false&size=23884&status=done&style=none&taskId=ub778d79f-2480-411f-97c3-d13aed04965&title=&width=735)

**第二步 文件静态分析**
使用 jest-haste-map 来进行项目中所有文件的检索以及生成文件之间的相互依赖关系，在 jest-core 中的 _run10000 方法中执行 buildContextsAndHasteMaps，返回 contexts 和 hasteMapInstances，contexts 中的 hasteFs 存储的就是文件及依赖关系。

**jest-haste-map **检索的过程中借助 jest-worker 来根据当前cpu核数并行的进行文件检索，借助 fb-watch-man/crawler 对整体文件变动做实时监听，做到只执行有改动的单元测试文件，实现单测缓存效果。

![unit-test-jest-haste.png](https://cdn.nlark.com/yuque/0/2021/png/116604/1640524931986-a0ee9e99-151b-464e-96f3-c5d403a258f5.png#clientId=u059512e6-4582-4&crop=0&crop=0&crop=1&crop=1&from=paste&height=555&id=u042b30bc&margin=%5Bobject%20Object%5D&name=unit-test-jest-haste.png&originHeight=1109&originWidth=2131&originalType=binary&ratio=1&rotation=0&showTitle=false&size=188410&status=done&style=none&taskId=u0c46aead-c2c6-4bd4-a90a-cf1e8cce042&title=&width=1065.5)
下方看一个简单的jest-haste-map使用示例
```javascript
import JestHasteMap from 'jest-haste-map';
import {cpus} from 'os';

const hasteMap = new JestHasteMap.default({
  extensions: ['js'],
  maxWorkers: cpus().length,
  name: 'test',
  platforms: []
});

const {hasteFS} = await hasteMap.build();
const testFiles = hasteFS.getAllFiles();

console.log(testFiles);
// ['/path/to/tests/list1.spec.js', '/path/to/tests/list2.spec.js', …]
```

**第三步 单测检索和排序**
经过第一步和第二步，我们拿到了 **配置对象 configs**，以及**文件Map HasteContext**，接下来通过 SearchSource 对象检索出所有的单元测试到一个数组中，检索出单元测试文件后，在正式执行之前，我们需要先对当前拿到的所有单测进行权重优先级排序。

单测排序的工作是由 jest Sequencer 完成的，默认排序优先级为 failed (上次失败的先运行)> duration(耗时长的先运行) > size(文件体积大的先运行)，当然这里我们也可以自定义customSequencer来覆盖 jest 默认的排序规则，jest 排序规则如下。

![unit-test-jest-scquencer.png](https://cdn.nlark.com/yuque/0/2021/png/116604/1640525025246-045963f5-1df6-411c-9257-74359f05e235.png#clientId=u059512e6-4582-4&crop=0&crop=0&crop=1&crop=1&from=paste&height=802&id=u61d4057e&margin=%5Bobject%20Object%5D&name=unit-test-jest-scquencer.png&originHeight=1603&originWidth=2726&originalType=binary&ratio=1&rotation=0&showTitle=false&size=292495&status=done&style=none&taskId=udcf49166-d29d-4ba5-97b4-f942d8b9fe4&title=&width=1363)
```javascript
		return tests.sort((testA, testB) => {
      if (failedA !== failedB) {
        return failedA ? -1 : 1;
      } else if (hasTimeA != (testB.duration != null)) {
        // If only one of two tests has timing information, run it last
        return hasTimeA ? 1 : -1;
      } else if (testA.duration != null && testB.duration != null) {
        return testA.duration < testB.duration ? 1 : -1;
      } else {
        return fileSize(testA) < fileSize(testB) ? 1 : -1;
      }
    });
```
**第四步 开始执行**
在经过第三步之后，我们拿到了经过排序后的单测文件，接下来开始进入到执行步骤，执行单测时的整个调度工作是 jest/core 中的 TestScheduler 来完成，例如 scheduler 会推算是串行执行还是并行执行，推算单测执行完的大概时间，覆盖率报告的生成等，scheduler 会调用 jest-runner 中的 runTests 方法去触发单测执行

如果需要并行执行，runTest 方法触发 jest-worker 创建多个child process 子进程来支持 parallel 执行

单元测试中全局方法和全局变量，比如 test() describe() it() 等是由 jest-cirucs(jest-jasmine) 提供并注入global中

![unit-test-jest-run-test.png](https://cdn.nlark.com/yuque/0/2021/png/116604/1640527878045-b379169e-e180-4226-884d-2da6b90321ec.png#clientId=u059512e6-4582-4&crop=0&crop=0&crop=1&crop=1&from=paste&id=u4114c79f&margin=%5Bobject%20Object%5D&name=unit-test-jest-run-test.png&originHeight=2878&originWidth=3480&originalType=binary&ratio=1&rotation=0&showTitle=false&size=683293&status=done&style=none&taskId=ue36536e2-f975-4782-8f78-6d5203e2ae6&title=)
最终单测的运行是由 jest-runtime 中创建的 vm 虚拟机隔离执行，vm 作用域中dom环境是由 jest-environment-jsdom 提供，此外 jest-runtime 中还包括了 transformer 能力以及mock功能的具体实现等，这部分功能在接下来的Mpx框架单元测试实现章节我们会去详细介绍它。

**第五步 处理返回结果**
此外 jest-runner中提供了一套类似于 redux 的数据流机制和eventEmitter来管理维护单测状态以及单测执行结果，在jest-runner 中进行事件触发，在TestScheduler 中进行事件监听并对执行结果进行各种处理和序列化，
最后在 jest-core 中的runJest方法中进行执行结果的终端输出/文件输出等一系列处理。
## 小程序单元测试
### 与 web 应用的不同
上个章节讲完前端单测简介，以及jest单测框架的大概运行原理后，接下来我们看下单元测试在小程序场景下与web场景的不同

首先小程序本身是双线程分离的机制，但目前并没有这种独特的运行环境用来执行单元测试，这里需要借助小程序官方提供的 miniprogram-simulate 工具集，来将整体运行机制调整为单线程模拟运行，并利用 dom 环境来进行小程序组件的注册渲染以及整个自定义组件树的搭建

小程序的单元测试执行依赖 js 运行环境和 dom 环境，这里我们选择 jest 框架来提供对应的环境

下方是一个简单的微信小程序官方提供的单元测试demo，具体关于miniprogram-simulate 的更多API的使用可以去官方文档查看 [https://github.com/wechat-miniprogram/miniprogram-simulate](https://github.com/wechat-miniprogram/miniprogram-simulate)
```javascript
import simulate from 'miniprogram-simulate'
test('comp', () => {
    const id = simulate.load(path.join(__dirname, './comp')) // 注册自定义组件，返回组件 id
    const comp = simulate.render(id) // 使用 id 渲染自定义组件，返回组件封装实例

    const parent = document.createElement('parent-wrapper') // 创建容器节点
    comp.attach(parent) // 将组件插入到容器节点中，会触发 attached 生命周期

    expect(comp.dom.innerHTML).toBe('<div>123</div>') // 判断组件渲染结果
    // 执行其他的一些测试逻辑

    comp.detach() // 将组件从容器节点中移除，会触发 detached 生命周期
})
```

此外对于小程序工具集的整体运行流程，在下方章节进行了简要总结。
### 小程序单测框架整体流程
小程序单元测试中微信官方提供的相关库有 miniprogram-simulate、j-component 和 miniprogram-exparser等

- miniprogram-simulate: 小程序自定义组件测试工具集，进行小程序内置组件的注册以及模拟微信原生api的注入
- j-component: 仿小程序组件系统，可以让小程序自定义组件跑在 web 端。
- miniprogram-exparser：微信小程序官方的组件系统模块，exparser 的组件模型和 WebComponents标准中的 Shadow DOM 高度相似，基于 Shadow DOM 原型，可在纯 JS 环境运行，维护整个组件的节点树相关的信息，包括属性、事件等。
- miniprogram-compiler:  wcc、wcsc 官方编译器的 node 封装版，用于编译 wxml、wxss 文件

开发者在使用的时候经常用的的两个方法就是 simulate.load 和 simulate.render 方法，那这里我们就从这两个方法为入口进行整个流程的总结
**1.miniprogramSimulate.load(path)**
![小程序-load.png](https://cdn.nlark.com/yuque/0/2022/png/116604/1645371259515-600e82a3-5a16-4b50-90d2-4de16b3a6e13.png#clientId=u8f88ae50-6693-4&crop=0&crop=0&crop=1&crop=1&from=paste&height=2179&id=u91907731&margin=%5Bobject%20Object%5D&name=%E5%B0%8F%E7%A8%8B%E5%BA%8F-load.png&originHeight=2179&originWidth=3100&originalType=binary&ratio=1&rotation=0&showTitle=false&size=655139&status=done&style=none&taskId=uffad3560-8564-4372-bf2f-ceded0ad196&title=&width=3100)
```javascript
let nowLoad
// miniprogram-simulate
function load(path, definition){
  // 省略部分判断
  const id = register(componentPath, tagName, cache, hasRegisterCache)
  cache.needRunJsList.forEach(item => {
    // nowLoad 用于执行用户代码调用 Component 构造器时注入额外的参数给 j-component
    nowLoad = item[1]
    // require('xxx.js')
    _.runJs(item[0])
  })
	return id
}
function register(componentPath, tagName, cache, hasRegisterCache) {
  // 随机生成，不重复
  const id = _.getId()
  const component = {
    id,
    path: componentPath,
    tagName,
    json: _.readJson(`${componentPath}.json`),
   	wxml: compile.getWxml(componentPath, cache.options),
    wxss: wxss.getContent(`${componentPath}.wxss`)
  }
  // 存入需要执行的自定义组件 js
  cache.needRunJsList.push([componentPath, component])
  return component.id
}
global.Component = options => {
	const component = nowLoad
  jComponent.register(definition)
}

function register(definition = {}) {
    const componentManager = new ComponentManager(definition)
    return componentManager.id
}

// ComponentManager 方法
class ComponentManager {
    constructor(definition) {
        // ......
        this.exparserDef = this.registerToExparser()
        _.cache(this.id, this)
    },
    registerToExparser() {
    ...
        const exparserDef = {
            is: this.id,
            using,
            generics: [], // TODO
            template: {
                func: this.generateFunc,
                data: this.data,
            },
            properties: definition.properties,
            data: definition.data,
            methods: definition.methods,
            ...
        }
        // miniprogram-exparser
        return exparser.registerElement(exparserDef)
    }
}

```

**2.miniprogramSimulate.render(id)**

![微信小程序-render.png](https://cdn.nlark.com/yuque/0/2022/png/116604/1645372791716-b3faf038-ff6f-4309-9a91-270bcfda4aa7.png#clientId=u8f88ae50-6693-4&crop=0&crop=0&crop=1&crop=1&from=paste&height=2069&id=u272fdda2&margin=%5Bobject%20Object%5D&name=%E5%BE%AE%E4%BF%A1%E5%B0%8F%E7%A8%8B%E5%BA%8F-render.png&originHeight=2069&originWidth=3131&originalType=binary&ratio=1&rotation=0&showTitle=false&size=668246&status=done&style=none&taskId=u0ed961d2-5859-4c1b-ac1b-79595d39e8e&title=&width=3131)
miniprogram-simulate中render方法会调用j-component create，根据id从缓存对象中获取componentManager，进行组件实例创建
```javascript
  /**
   * 创建组件实例
   */
  create(id, properties) {
    const componentManager = _.cache(id)

    if (!componentManager) return

    return new RootComponent(componentManager, properties)
  },
```
RootComponent 构造函数中使用之前的 _exparserDef 对象进行真实dom节点创建，生成 _exparserNode
```javascript
class RootComponent extends Component{
	constructor(componentManager, properties) {
  	...
    this._exparserNode = exparser.createElement(tagName || id, exparserDef) // create exparser node and render
		...
    this._bindEvent() // touchstart，touchemove blur 等事件绑定
  }
}
```
新生成的 rootComponent 实例继承Component对象，定义了许多我们单测中需要用到的组件方法
```javascript
class Component {
	get dom() ...
  get data() ....
  get instance ...
  dispatchEvent ...
  addEventListener ...
  removeEventListener ...
  querySelector ...
  setData ...
  triggerLifeTime ...
  triggerPageLifeTime ...
  toJSON...
}
```

当然中间还有很多细节实现，比如模版渲染 j-component/template/compile，组件更新 j-component/render 等，感兴趣的话可以详细去看下里边具体的实现，这里我们暂且按下不表。至此，我们拿到了 component 实例，并可以进行正常的组件状态获取以及更新，然后在Jest框架中去断言组件的各种属性以及方法执行后的预期。
## Mpx 框架单元测试
经过上方 Jest 框架讲解以及小程序单元测试流程分析后，接下来看下在Mpx框架中的单测能力支持实现
### 初期版本
Mpx框架的初期单测架构，是将Mpx框架开发的小程序项目，先构建编译为源码，再使用 miniprogram-simulate + j-component + jest 对构建后的小程序原生代码运行单元测试
![mpx-old-unit-test-architecture.png](https://cdn.nlark.com/yuque/0/2021/png/116604/1640786157277-5f92065d-c87e-46ed-b57e-4692b3d78a36.png#clientId=uc72cd25a-bebe-4&crop=0&crop=0&crop=1&crop=1&from=paste&height=485&id=uf9a7caa5&margin=%5Bobject%20Object%5D&name=mpx-old-unit-test-architecture.png&originHeight=969&originWidth=3076&originalType=binary&ratio=1&rotation=0&showTitle=false&size=744497&status=done&style=none&taskId=uf25026f4-fd27-4116-bcb5-ffbe7357910&title=&width=1538)
该方案执行任何case都需要执行完整的构建流程，而且预构建已经完成了所有的模块收集，无法使用jest提供的模块mock功能，导致业务使用成本很高，落地困难。
### 优化版本
经过调研，Jest 本身支持代码转换功能
> Jest在项目中以JavaScript的代码形式运行，但是如果使用一些Node.js不支持的，却可以开箱即用的语法(如JSX，TypeScript中的类型，Vue模板等)那你就需要将代码转换为纯JavaScript，转换的工作就是transformer


这里我们就可以通过Jest提供的转换能力编写mpx-jest转换器，实现在Jest模块加载过程中实时地将当前的Mpx组件编译转换为原生小程序组件，再交由miniprogram-simulate加载运行测试case。

该方案中模块加载完全基于Jest并能实现按需编译，完美规避旧方案中存在的缺陷，缺点在于编译构建流程基于Jest api重构，与Mpx自身基于Webpack的构建流程独立存在，带来额外维护成本，这一问题我们通过将通用的编译转换逻辑抽离出来统一维护，在Webpack和Jest两侧复用，从而解决了改问题。同时在实现这个方案的过程中也做了一部分对应库的改动，将会在下方介绍。

首先来看下 jest-runtime 中 transform 的整体流程。

- runTest 方法调用 runtime.requireModule(path)，传入对应的单测文件地址
- 判断是否是mock module，如果是则直接走 requireMock方法，否则继续往下进行
- 定义 localModule
- 调用 this._loadModule
- _createRequireImplementation(module, options) 赋值给module.require
- transformFile 处理对应的文件
- createScriptFromCode(transformdCode)
- getVmContext  使用 vm 创建沙盒环境
- 在沙盒环境执行对应的 jest 单测代码

![jest-runtime1.png](https://cdn.nlark.com/yuque/0/2022/png/116604/1645251815753-ba8529bb-c63f-477f-bb2a-60182bf5f390.png#clientId=u3600a0a4-27fc-4&crop=0&crop=0&crop=1&crop=1&from=paste&height=811&id=u9a266c8b&margin=%5Bobject%20Object%5D&name=jest-runtime1.png&originHeight=3242&originWidth=4075&originalType=binary&ratio=1&rotation=0&showTitle=false&size=1246325&status=done&style=none&taskId=uae1603dd-c05f-443b-977e-849426edf0d&title=&width=1019)
其中关键节点的代码如下
```javascript
			// 自定义 localModule
			const localModule = {
        children: [],
        exports: {},
        filename: modulePath,
        id: modulePath,
        loaded: false,
        path: path().dirname(modulePath)
      };
      // 自定义 module.require
			Object.defineProperty(module, 'require', {
        // rquireModuleOrMock || rquireInternalModule
      	value: this._createRequireImplementation(module, options)
    	});

			// transformCode
			const transformedCode = this.transformFile(filename, options);
			
			// createScriptFromCode
			const script = vm.script('({"' + EVAL_RESULT_VARIABLE + `":function(${args.join(',')}){` + transformedCode + '\n}});';)
			const vmContext = this._environment.getVmContext();
      runScript = script.runInContext(vmContext, {
        filename
      })
			compiledFunction = runScript[EVAL_RESULT_VARIABLE]
      compiledFunction.call(
        module.exports,
        module, // module object
        module.exports, // module exports
        module.require, // require implementation
        module.path, // __dirname
        module.filename, // __filename
        // @ts-expect-error
        ...lastArgs.filter(notEmpty),
      );
```

上方是整个 jest-runtime 中对于require module 时transform的整体流程。在Jest的这一能力之上，我们基于 @mpxjs/webpack-plugin 开发了 mpx-jest transformer，实现将 Mpx 单文件组件转换输出为对应的小程序原生代码。
![改良方案01.png](https://cdn.nlark.com/yuque/0/2022/png/116604/1645264785364-2db4095b-0344-4fa8-8d56-bfeb28c0f78d.png#clientId=uec723a90-39b3-4&crop=0&crop=0&crop=1&crop=1&from=paste&height=1588&id=ubbef4532&margin=%5Bobject%20Object%5D&name=%E6%94%B9%E8%89%AF%E6%96%B9%E6%A1%8801.png&originHeight=1588&originWidth=3007&originalType=binary&ratio=1&rotation=0&showTitle=false&size=368757&status=done&style=none&taskId=u8c2c10f8-f83f-4765-b312-bb75081e05c&title=&width=3007)
在完成代码转换后，对应的 script 代码做为String存在于内存中，无法直接使用 Jest 环境的 require 加载执行，为此我们参考上述 jest-runtime 中的 loadModule方法实现了requireFromString方法，核心还是使用node vm 模块来进行 script 代码的执行，同时将jsdom-environment 和 Jest global 对象合并做为 vmContext

![改造方案2.png](https://cdn.nlark.com/yuque/0/2022/png/116604/1645269513406-df59853a-086d-4d5f-87a5-cb003d556ce9.png#clientId=uec723a90-39b3-4&crop=0&crop=0&crop=1&crop=1&from=paste&height=802&id=u2da3911b&margin=%5Bobject%20Object%5D&name=%E6%94%B9%E9%80%A0%E6%96%B9%E6%A1%882.png&originHeight=802&originWidth=1970&originalType=binary&ratio=1&rotation=0&showTitle=false&size=125179&status=done&style=none&taskId=u182d9b94-f659-4d25-80d5-d9d01fdbaac&title=&width=1970)
至此，我们的整体单测方案就大致完成，通过 mpx-jest 转换组件，再交由 miniprogram-simulate 来渲染组件实例，从而完成对组件状态的断言，在实际测试的过程中，还遇到了以下问题进行解决。

1.Mpx框架的文件纬度的条件编译支持
Mpx框架的跨平台输出部分支持对文件进行平台和应用的条件编译引用
```javascript
// 文件列表
example.wx.mpx
example.ali.mpx

// 代码使用
{
	example: '../src/example'
}
```
这里我们需要在Jest运行时环境中提供该功能，借助Jest本身提供的 resolver 自定义能力，让我们可以对请求的文件进行自定义resolve功能，这里我们使用Mpx中现有的resolve plugin 和 enhanced-resolve来自定义resolve方法进行文件条件编译的支持。
```javascript
const { CachedInputFileSystem, ResolverFactory } = require('enhanced-resolve')
const AddModePlugin = require('@mpxjs/webpack-plugin/lib/resolver/AddModePlugin')

module.exports = (request, options) => {
  const addModePlugin = new AddModePlugin('before-file', 'wx', {
    include: () => true
  }, 'file')
  // create a resolver
  const myResolver = ResolverFactory.createResolver({
    ...
    plugins: [addModePlugin]
  })
  let result = myResolver.resolveSync({}, options.basedir, request)
	return result.split('?')[0]
}
```
2.miniprogram-simulate 定制化方法
在小程序单元测试的章节中，我们介绍了小程序相关库的运行机制，miniprogram-simulate提供的 load 方法默认只解析渲染原生组件，我们的Mpx组件，mpx-jest 转换器无法和miniprogram-simulate进行关联，所以这里我们选择fork miniprogram-simulate 仓库，自定义了loadMpx和registerMpx方法。
```javascript
// 使用
import simulate from '@mpxjs/miniprogram-simulate'
const id = simulate.loadMpx('src/components/list.mpx')

//@mpxjs/miniprogram-simulate 中 loadMpx 实现简单描述
function loadMpx(path, tagName, options = {}) {
	// ...省略一部分校验逻辑
  // .mpx 结尾文件会经过 mpx-jest 进行转换，输出 wxml,wxss,json,script
  const componentContent = require(componentPath)
  id = registerMpx(componentPath, tagName, cache, hasRegisterCache, componentContent)
  //....
  return id
}
function registerMpx(...){
  // 部分 require('xx/xx.json') 等修改为直接赋值
}

```
对于组件/页面在存在大量组件引用的情况下，mock引用组件可大大提升单测的运行速度，原有miniprogram-simulate框架并没有提供mock功能，所以这里我们也自定义了mockComponent和clearMockComponent方法。
```javascript
// 代码在 @mpxjs/miniprogram-simulate 中
let mockComponentMap = {}

function registerMpx() {
	// 判断是否是mock的组件
  if (mockComponentMap[tagName]) {
    componentPath = mockComponentMap[tagName]
  }
}
/**
 * mock usingComponents中的组件
 * @param compName
 * @param compDefinition
 */
function mockComponent(compName, compDefinition) {
  mockComponentMap[compName] = compDefinition
}
/**
 * 清除 component mock 数据
 */
function clearMockComponent() {
  mockComponentMap = {}
}

// 单测中使用时
simulate.mockComponent('list', {
  template: '<view>component list</view>'
})
```
3.封装定制test-utils工具集
书写单测的过程中我们会有很多重复工作，比如创建挂载组件、代理接口、模拟多个组件、断言多个数据等，这里我们将这些共性的方法抽离封装成了 test-utils
```javascript
/**
 * 创建渲染并挂载自定义组件
 * @param {组件基于所在项目的相对路径,例如'src/subpackage/gulfstream/components/bottom/bottom.mpx'} compPath
 * @returns 用于测试的自定义组件
 */
export function createCompAndAttach (compPath, renderProps = {}) {
  const id = simulate.loadMpx(compPath)
  let comp = simulate.render(id, renderProps)
  const parent = document.createElement('div')
  comp.attach(parent)
  return comp
}

/**
 * 借助xfetch构造mock请求
 * @param {待模拟url} mockUrl
 * @param {mock数据文件路径} mockFilePath
 */
export function proxyFetch (mockUrl, mockUrlData) {
  let mockData
  mpx.xfetch.fetch = jest.fn( (options) => {
    return new Promise((resolve) => {
      if (options.url.includes(mockUrl)) {
        if (typeof mockUrlData === 'string') {
          mockData = getMockContent(mockUrlData)
        } else {
          mockData = mockUrlData
        }
      }
      resolve({
        errno: 0,
        data: mockData
      })
    })
  })
}
......
```

至此，Mpx框架的单元测试方案整体上就完备了，整体上的方案架构如下图所示
![Mpx单测架构图.png](https://cdn.nlark.com/yuque/0/2022/png/116604/1645448762294-8e4cb0ab-bc09-4688-9360-ab4d67776af1.png#clientId=uc67aedb9-b0af-4&crop=0&crop=0&crop=1&crop=1&from=paste&height=1164&id=u19264b9b&margin=%5Bobject%20Object%5D&name=Mpx%E5%8D%95%E6%B5%8B%E6%9E%B6%E6%9E%84%E5%9B%BE.png&originHeight=2327&originWidth=3335&originalType=binary&ratio=1&rotation=0&showTitle=false&size=7199152&status=done&style=none&taskId=uc2ecd51a-8419-46f1-a52a-1c9a8868ce1&title=&width=1667.5)
## Mpx组件单元测试实战
在上方介绍过整体的jest框架流程以及Mpx框架单元测试架构后，接下来我们着手进行 Mpx 框架开发的小程序组件的单元测试用例书写实战

使用 @mpxjs/cli 创建模版项目时选择使用单元测试，**会自动生成有单测能力的模版项目**，和普通 Jest + miniprogram-simulate 搭建的原生小程序单测项目不同的是，transform 中添加了 Mpx 文件的处理，这里jest.config.js其他配置就不过多列出，可通过新创建项目进行查看。
```json
	transform: {
    '^.+\\.js$': '<rootDir>/node_modules/babel-jest',
    '^.+\\.mpx$': '<rootDir>/node_modules/@mpxjs/mpx-jest'
  }
```
首先我们列出一个组件示例，具体项目可点击链接查看:
[https://github.com/Blackgan3/mpx-unit-test-demo](https://github.com/Blackgan3/mpx-unit-test-demo)

首先对于组件单测的书写，我们希望有一套固定的规范，即所写的不同组件的单测能有一个相同的格式和顺序，这里我们建议的顺序为

- 组件初始化断言
- 组件初始化各种形态断言
- 组件变化- data|computed|watch变化断言
- 组件变化- 事件触发断言
- 组件销毁断言

根据上方组件功能，首先我们建议对组件usingComponents 引入的组件进行模拟注册，这样可以节省组件渲染挂载的时间
```javascript
	beforeEach(() => {
    // 进行usingComponents 组件 mock
    testUtils.mockComponents([
      'list'
    ])
  })
```
1.我们首先需要对组件初始化成功后进行各种组件形态预期，即组件初始化断言
```javascript
	it('test component init correctly', function () {
    const comp = testUtils.createCompAndAttach(compPath)
    const insData = comp.instance.data
    testUtils.checkExpectedData(insData, {
      someClassShowOne: false,
      someClassShowTwo: false,
      someClassShowTwoFlag: false,
      listData2: ["手机", "电视", "电脑"],
      key: 1,
      compStatus: 1,
      timeDeferFlag: false
    })
    const domHTML = comp.dom.innerHTML
    // 进行组件初始化dom快照测试
    expect(domHTML).toMatchSnapshot()
  })
```
上方我们使用工具方法创建并挂载生成组件实例，然后对组件data中key值和value进行预期断言，最后对组件初始化生成的HTML进行快照测试

2.组件初始化各种形态断言
当组件的初始化数据源有多种形态，比如你的组件初始化数据是由接口或者其他重要的props传递过来决定的，那这里我们可以对不同的数据源组件的不同表现进行断言
```javascript
	it ('test comp different data', async function () {
    // 进行唯一数据源请求的接口代理
    proxyFetch('api/somePackage/getCompData', {
      status: 1
    })
    const comp = testUtils.createCompAndAttach(compPath)
    // 目前 status 为 1，再次改变数据源代理
    proxyFetch('api/somePackage/getCompData', {
      status: 2
    })
    await comp.instance.fetchCompData()
    await comp.instance.$nextTick()
    expect(comp.instance.data.compStatus).toBe(2)
    expect(comp.instance.data.compData).toEqual({status: 2})
    expect(comp.dom.innerHTML).toMatchSnapshot()
		// 再次改变数据源代理，修改源数据
    proxyFetch('api/somePackage/getCompData', {
      status: 3
    })
    await comp.instance.fetchCompData()
    await comp.instance.$nextTick()
    expect(comp.instance.data.compStatus).toBe(3)
    expect(comp.instance.data.compData).toEqual({status: 3})
    expect(comp.dom.innerHTML).toMatchSnapshot()
  })
```

3.组件变化- props|data|computed|watch变化断言
接下来我们需要对组件自身的 props|data|computed|watch 等属性变化时所触发的组件相应变化做出各种预期。
```javascript
	// 组件 props 改变后组件的各种形态预期
	it('test props different values correspond to different performance', function () {
    // 传入初始渲染 props
    const successContent = 'some successContent'
    const comp = testUtils.createCompAndAttach(compPath, {
      successContent
    })
    const childComp = comp.querySelector('.successContent')
    expect(childComp).toBeDefined()
    expect(comp.instance.data.successContent).toBe(successContent)
    // 对最终的HTML进行快照测试
    expect(childComp.dom.innerHTML).toMatchSnapshot()
  })
	// 当组件data中的someClassShowOne改变之后需要做的哪些预期
	// 当组件computed中的someCompShow改变之后需要做的预期
	// ......
	
```
4.组件必不可少的会有方法，这里我们对示例组件的方法调用进行预期
```javascript
	it ('test someClassShowTwoFlag tap event trigger', async function () {
    const comp = testUtils.createComp(compPath)
    const fetchCompDataSpy = jest.spyOn(comp.instance, 'fetchCompData')
    const changeSomeClassShowTwoFlagSpy = jest.spyOn(comp.instance, 'changeSomeClassShowTwoFlag')
    proxyFetch('api/somePackage/getCompData', {
      status: 1
    })
    comp.attach(document.body)
    const compData = comp.instance.data
    const changeFlagViewComp = comp.querySelector('.changeFlagClass')

    // dispatchEvent 为异步
    changeFlagViewComp.dispatchEvent('tap')
    await testUtils.sleep(0)

    expect(changeSomeClassShowTwoFlagSpy).toBeCalledWith(true)
    expect(fetchCompDataSpy).toHaveBeenCalledTimes(2)
    expect(compData.someClassShowTwo).toBeTruthy()
    expect(comp.instance.someClassShowTwoFlag).toBeTruthy() // 此处注意 非template中使用过到的data，获取更新后的值，从instance中获取
    expect(comp.dom.innerHTML).toMatchSnapshot()
  })	

	it('test someTimeDeferAction tap event trigger', async function () {
    jest.useFakeTimers()
    jest.spyOn(global, 'setTimeout')

    const comp = testUtils.createCompAndAttach(compPath)
    const compData = comp.instance.data
    const someTimeDeferActionSpy = jest.spyOn(comp.instance, 'someTimeDeferAction')
    const childComp = comp.querySelector('.someTimeDeferActionClass')
    childComp.dispatchEvent('tap')

    // comp.instance.someTimeDeferAction()
    await Promise.resolve()

    jest.runAllTimers()
    await comp.instance.$nextTick()

    expect(compData.timeDeferFlag).toBeTruthy()
    expect(someTimeDeferActionSpy).toHaveBeenCalledTimes(1)
    expect(comp.dom.innerHTML).toMatchSnapshot()
    jest.useRealTimers()
  })
```
以上，我们对当前的示例组件完成了整体内容的单元测试书写，完整版单测文件可点击链接查看
[https://github.com/Blackgan3/mpx-unit-test-demo/blob/master/test/components/example.spec.js](https://github.com/Blackgan3/mpx-unit-test-demo/blob/master/test/components/example.spec.js)
## 结语
通篇文章我们依次进行了前端常用单测框架简介，jest框架原理总结，小程序单元测试内部执行流程，最后介绍Mpx框架中单测能力的支持实现以及Mpx组件单测实战。

学习到了jest不仅仅是一个单元测试框架，你甚至可以使用它的各个工具库自己创建一个单元测试框架；以及感受到小程序场景下单元测试的差异化；Mpx框架层面也做了诸多改造来支撑单测功能的落地。

后续我们还会继续跟进推动业务中落地TDD规范，复杂逻辑组件中各种功能场景单测用例规范的补充等问题，持续在小程序单测方向深耕并有更好的规范总结产出。

参考文章：
* [https://jestjs.io](https://jestjs.io/)
* [https://jestjs.io/docs/architecture](https://jestjs.io/docs/architecture)
* [https://medium.com/code-for-cause/jest-architecture-9870bbfcda44](https://medium.com/code-for-cause/jest-architecture-9870bbfcda44)

