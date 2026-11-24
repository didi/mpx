# RN 与 Web 支持 onPageNotFound 实现方案

## 目标与依据

支持 RN、Web 的 `createApp({ onPageNotFound })` 与 `mpx.onPageNotFound / mpx.offPageNotFound` 入口通知，同时保证运行中的路由 API 跳转失败只通过 API 的 `fail → complete` 返回，不触发 `onPageNotFound`。

本方案以用户提供的微信模拟器实测为行为依据：

- 基础库版本：3.15.2。
- `navigateTo / redirectTo / reLaunch / switchTab` 跳转不存在页面：`fail → complete`，未触发 `onPageNotFound`。
- 不存在页面作为启动入口：触发 `onPageNotFound`，`isEntryPage: true`。
- 各观察窗口为 1.5 秒，尚未真机验证。

上述结果只证明事件触发边界，不证明生命周期先后顺序、无处理函数时的展示行为、回调内跳转时机或热启动语义。下文的首页回退、通知时机及热启动处理是本次拟定的 Mpx 跨端行为，不作为微信实测结论。

方案已于 2026-10-09 实施，代码、相关文档与 RN Skill 已同步。文末记录实际验证范围。

## 行为约定

| 场景 | 预期行为 |
| --- | --- |
| 正常启动，或未指定启动路径 | 使用指定页面或首页，不触发回调 |
| 指定了未注册的启动路径 | 记录原始缺失入口，回退首页，路由可用后触发一次回调 |
| 缺失入口且既无 App 回调也无 API 监听 | 保留首页回退与必要诊断，不挂起启动流程 |
| 回调只上报、不跳转 | 停留首页，启动正常完成 |
| 回调调用 `redirectTo / reLaunch` 到合法页面 | 正常跳转，不再由框架执行第二次首页回退 |
| 运行中 API 跳转到不存在页面 | `fail → complete` 各一次，不调用 `success`，不触发应用回调，不改变有效页面栈 |
| 已注册页面的异步加载或执行失败 | 不属于页面不存在，不转成 `onPageNotFound` |
| RN 前后台切换或普通重渲染 | 不重复通知 |
| RN 根组件销毁后重建，并由宿主传入新的缺失入口 | 每次根组件初始化最多通知一次；同一 JS 上下文仍保留现有 `onLaunch` 只执行一次的约定 |

RN 当前 `switchTab` 是不支持的 API。本次保持现状，不为补齐通知而新增 RN tabBar 或 `switchTab` 能力；RN 路由失败验收覆盖已有的 `navigateTo / redirectTo / reLaunch`，Web 覆盖四个 API。

回调参数：

```js
{
  path: 'pages/missing',
  query: { from: 'entry' },
  isEntryPage: true
}
```

- `path` 为原请求的缺失页面路径，不带开头 `/`，不含 query；不能替换为回退首页的路径。
- Web 复用路由解析得到的 `to.query`；RN 复用 `parseAppProps` 的 `initialParams`，未传时为 `{}`。不重复进行 URL 解码，不改变 RN 参数既有类型契约。
- RN 的 `initialRouteName` 仍要求使用注册页面路径格式，不新增 URL 字符串解析能力；query 继续通过 `initialParams` 传递。
- `this` 与各端现有 App 生命周期一致：RN 为 `appInstance`，Web 为 App 的 Vue 组件实例。
- 本次只有入口通知，`isEntryPage` 固定为 `true`，不新增 `false` 场景。
- 安装 `@mpxjs/api-proxy` 后，支持 `mpx.onPageNotFound(listener)` 注册与 `mpx.offPageNotFound(listener)` 取消；不传 listener 则移除全部 API 监听，不移除 App 生命周期回调。
- API 监听与 App 回调共用通知时机和参数。在启动前或 `onLaunch` 中注册，通知后不补发。两者都未声明时才通过 Mpx 的 `error` 报告。
- 新增 API 默认不参与 Promise 化，RN 的 `canIUse` 支持查询这两个 API。

## 实施前的问题

### RN

主要入口为 [createApp.ios.js](../packages/core/src/platform/createApp.ios.js)：

1. `notSupportTip(rawOptions, ['onThemeChange', 'onPageNotFound'])` 默认会提示并删除回调。
2. `parseAppProps(props)` 提供 `initialRouteName / initialParams`，通过 `hasOwn(pagesMap, initialRouteName)` 校验页面。
3. 非法入口目前打印错误并忽略整份初始路由配置，使用 `firstPage + {}`，原缺失路径和参数没有保留。
4. `global.__mpxAppOnLaunch` 由 [getDefaultOptions.ios.js](../packages/core/src/platform/patch/getDefaultOptions.ios.js) 在首个页面实例初始化、`created` 之前调用。这里不是适合新增导航副作用的位置。
5. 运行中无法处理的导航由 `onUnhandledAction` 转交 `lastFailCallback`；此链路应继续只处理路由 API 失败。

### Web

[optionProcessor.js](../packages/webpack-plugin/lib/runtime/optionProcessor.js) 已有入口缺失分支，但存在以下问题：

- 使用 `stack.length < 1` 判断首次进入；`stack` 会从 sessionStorage 恢复，不能可靠代表本次启动状态。
- 从 `router.app.$options` 查找回调，但根 Vue 实例只是 `render: h => h(App)` 的容器；业务 App 生命周期位于子 App 组件，且首次导航守卫运行时业务实例未必创建。
- 有回调时直接调用并 `return`，没有 `next`，可能使初始导航或 SSR 的 `router.onReady` 一直等待。
- 参数直接使用 `to.path`，包含开头 `/`；直接调用也没有绑定业务 App 实例。
- 路由存在性通过静态 `routes.some` 判断，没有复用最终 router 的匹配结果。

[route/index.web.js](../packages/api-proxy/src/platform/api/route/index.web.js) 的 `reLaunch` 在 `delta > 0` 时先 `go` 并直接报告成功。如果目标不存在，仅靠守卫报错不能保证 API 正确失败，也无法避免先改变浏览器历史。

## RN 实现

### 入口检测与记录

在 `createApp.ios.js` 中移除 `onPageNotFound` 的不支持过滤，仅保留 `onThemeChange`。生命周期名单已有该名称，无需新增内部生命周期常量。

复用当前入口校验，在非法入口分支中记录待通知对象：`{ path: initialRouteName, query: initialParams || {}, isEntryPage: true }`。记录保存在根组件实例的 ref 中，Hook 始终在顶层调用。记录不依赖当前是否有回调，以支持在后续 `onLaunch` 中注册 API 监听。

继续使用 `firstPage + {}` 初始化真实导航状态，避免把非法 route name 交给导航器，也避免缺失入口参数泄漏到首页。导航就绪时若既无 App 回调也无 API 监听，则通过 `error` 报告非法入口；否则交由业务处理。

### 路由就绪后通知

在现有 `NavigationContainer` 接入 `onReady`，读取并先清空待通知 ref，再调用 App 回调并派发 `global.__mpxAppCbs.pageNotFound` 中的 API 监听；App 回调仍以 `appInstance` 为 `this`。

React Navigation 的 `onReady` 表示导航容器及导航树完成挂载，适合安排依赖导航可用性的工作。此处选择该接入点，避免把新回调塞进页面初始化期间的 `__mpxAppOnLaunch`。[官方说明](https://reactnavigation.org/docs/navigation-container/#onready)

约束如下：

- `onLaunch / onShow` 继续走既有路径，以实际回退首页和其参数生成启动信息，不在本次改造其参数语义。
- 缺失入口信息只通过 `onPageNotFound` 传递。通知发生时首页已经初始化，可能已经执行首页生命周期；不承诺无首页闪现，也不模拟微信错误页。
- 先清空待通知记录，再调用业务，防止重入或重复 ready 通知二次派发。
- 入口记录只服务本次根组件初始化；ready 后 props 更新不产生新的入口通知。
- 不引入定时延迟，不在 React render 中调用新回调，不创建虚拟页面或额外导航器。

### 保持导航失败独立

`onUnhandledAction` 不调用应用回调。需要结合现有 [RN route 实现](../packages/api-proxy/src/platform/api/route/index.ios.js) 修正并验证失败收尾：

- `navigateTo / redirectTo / reLaunch` 的成功、失败回调应在 dispatch 前登记，避免同步未处理动作先发生、失败回调却尚未注册。
- 成功、失败以及超时结束时，在调用业务回调前清空本次成功和失败槽位，避免后续状态变化误报成功，以及业务在 `fail` 内再次跳转时被旧锁阻塞。
- 沿用 `failHandle` 保证 `fail → complete`，不将任意 unhandled action 判定为“启动入口不存在”。
- 不为本次需求再维护一份全局页面注册表，不扩展成通用导航队列重构。

## Web 实现

### 明确入口状态与存在性判断

在 `optionProcessor.js` 的每个 router 实例内维护入口已检查标记和待通知数据。入口标记与页面栈长度、sessionStorage 内容无关；首次入口检查后即消费标记，首页重定向不产生第二次通知。

路由守卫区分框架首次导航与 `__mpxAction` 标识的 API 导航，后者始终走 API 失败分支。页面匹配采用最终 router 的 `to.matched.length`，API 预校验使用 `router.resolve(url).route.matched.length`，默认基于当前路由解析，复用现有相对路径、query、alias 和 redirect 解析。

匹配行为以生效的 `webConfig.routeConfig` 为准：用户显式配置的兜底路由已经接管未知 URL，不再同时触发框架的入口不存在通知。`/` 重定向到首页属于合法入口。已匹配记录但组件加载失败也不属于缺失页面。

### 分离守卫处理与 App 回调

首次入口未匹配时：

1. 在 router 上保存原始 `{ path, query, isEntryPage: true }`，不从根容器读取业务回调。
2. 调用一次 `next({ path: '/' + firstPage, replace: true })` 完成首页回退，不留下悬挂的导航。
3. [core/createApp.js](../packages/core/src/platform/createApp.js) 的 Web App 生命周期在 `onLaunch / onShow` 执行后，通过实例 `$nextTick` 消费待通知数据，以该 App 实例为 `this` 调用回调。
4. 调用前删除待通知数据，同时派发 `global.__mpxAppCbs.pageNotFound` 中的 API 监听。既无 App 回调也无 API 监听时使用 Mpx 的 `error` 报告；业务跳转后框架不再回退首页。

通知逻辑只在浏览器端启用。SSR 请求不派发业务回调，未知入口仍结束导航并按现有默认首页策略处理，不引入服务端 404 协议；客户端 hydration 需要验证只通知一次。本次假定 `firstPage` 配置正确，不额外处理首页配置错误的场景。

该方案有意将 Web 从“回调存在时暂停初始导航”调整为“先完成首页回退，再通知”。这是可观察的兼容性变化，需要在文档中说明，业务回调应使用 `redirectTo / reLaunch` 替换兜底页，而不依赖阻塞导航。

### 路由 API 在副作用前拒绝缺失目标

在 `route/index.web.js` 内复用一个小型局部校验方法，四个 API 调用 `router.resolve` 检查目标是否匹配：

- 无匹配时通过 `failHandle({ errMsg: '<api>:fail page ... is not found' }, fail, complete)` 返回并提前退出。
- 校验必须在修改 `routeCount / __mpxAction / __mpxEventChannel`、执行 `go / push / replace` 前完成，尤其覆盖 `reLaunch` 的多层栈分支。
- 保留既有 tabBar 合法性校验，不允许 `switchTab` 接受普通页面。
- 守卫保留非入口未匹配时的失败保护，通过 `next(error)` 明确结束导航；不得通过该分支补发 `onPageNotFound`。
- 浏览器运行中手工改 hash 或其他直接 router 导航到未知地址不作为新启动入口；整页刷新形成新的启动实例才重新检测。

本次不重写所有合法 `reLaunch / switchTab` 的历史栈与完成回调模型，只确保缺失目标在副作用发生前失败。

## API 监听接入

沿用应用事件的 `__mpxAppCbs` 注册表，core 的 Web/RN 环境初始化与 api-proxy 的应用事件模块均增加 `pageNotFound` 列表，保证两种模块加载顺序都可使用。

Web/RN 共用 `api/app/index.web.js` 的监听实现，取消监听复用已有 `off` 方法；小程序默认入口透传宿主同名 API。派发前取得 API 监听快照，避免回调中的注册或取消操作改变本轮遍历。App 生命周期回调独立保留，不放入可被 `offPageNotFound` 清空的 API 列表。

## 修改范围

| 文件 | 修改内容 |
| --- | --- |
| `packages/core/src/platform/createApp.ios.js` | 启用回调、记录缺失入口、onReady 派发、导航回调槽位收尾 |
| `packages/core/src/platform/createApp.js` | Web App 实例在启动完成后消费 router 上的待通知数据 |
| `packages/core/src/platform/env/index.{web,ios}.js` | 初始化 `pageNotFound` 监听列表 |
| `packages/api-proxy/src/platform/api/app/index.web.js`、`index.js` | 注册/取消监听及小程序宿主透传 |
| `packages/api-proxy/@types/index.d.ts`、`src/platform/api/base/rnCanIUseConfig.js` | 补齐类型导出与 RN 能力查询 |
| `packages/api-proxy/__tests__/web/app-event.spec.js`、`__tests__/rn/canIUse.spec.js` | 监听移除、API 安装、Promise 化排除及能力查询 |
| `packages/webpack-plugin/lib/runtime/optionProcessor.js` | 独立入口标记、路由匹配、缺失入口回退、导航明确收尾及 SSR 隔离 |
| `packages/api-proxy/src/platform/api/route/index.web.js` | 四个 API 的缺失目标预校验 |
| `packages/api-proxy/src/platform/api/route/index.ios.js` | dispatch 前登记回调及超时收尾 |
| `packages/core/__tests__/rn/createApp.spec.js` | 更新旧的不支持断言，覆盖入口回调与初始化 |
| `packages/webpack-plugin/test/runtime/web/option-processor.spec.js`（新增） | 集成真实 Vue 与 Vue Router，覆盖 core App 回调实例、通知时机、入口守卫、回退和恢复历史栈 |
| `packages/webpack-plugin/package.json` | 增加测试所需的 Vue Router 3 开发依赖 |
| `packages/api-proxy/__tests__/{web,rn}/route.spec.js` | 失败顺序、同步失败、无副作用与后续合法跳转 |

当前 `createApp` 类型使用 `WechatMiniprogram.App.Options<T>`，无需重复定义 `onPageNotFound`。实施时核对现有类型即可；不新增配置开关、不修改编译器页面注册产物，也不需要修改 `runtime/components/react/utils.tsx`。

## 核心测试与验收

1. **RN 入口**：合法路径、无路径不通知；缺失路径保留原始 query，真实初始路由仍为首页且参数为空；ready 前不调用，ready 后一次，`this` 正确；无回调继续回退。
2. **RN 生命周期**：重渲染、重复 ready、前后台切换不重发；根组件重建可产生新通知，但不重复冷启动 `onLaunch`。现有 mock 的 `useRef` 每次返回新对象，需使用能够保留 Hook 状态的渲染测试验证去重，不能仅靠手动重复调用组件函数断言。
3. **Web 入口**：hash/history 模式分别测试不存在 URL；sessionStorage 中有旧栈仍识别为本次入口；回调无前导 `/`、query 正确，根容器与业务 App 实例不同也可调用；正常 `/`、合法 redirect/alias、已注册异步页面不误报。
4. **Web 导航收尾**：回调不跳转也完成启动；无回调回退；SSR 的 onReady 不悬挂、不执行通知；客户端仅通知一次；自定义兜底路由不重复触发。
5. **回调内恢复**：两端分别在回调内 `redirectTo / reLaunch` 到有效页，确认路由可用、不被二次回退覆盖；回调再跳缺失页只触发 API 失败、不递归通知。
6. **运行中失败**：Web 四个 API、RN 三个已支持 API 逐一断言 `fail → complete` 各一次，无 success、无 onPageNotFound；Web 特别覆盖 `reLaunch` 多层栈不调用 go，失败不遗留 action/EventChannel；RN 模拟同步 onUnhandledAction，之后的状态变化不能补发旧 success，下一次合法跳转正常。
7. **API 监听**：只有 API 监听、App 回调与 API 监听共存、`onLaunch` 注册、指定移除与全部移除、晚注册不补发、SSR 不派发、API 默认不 Promise 化及 RN `canIUse`。
8. **加载错误隔离**：已注册页面的异步模块拒绝、页面脚本异常不触发页面不存在通知。

实施后对修改的 JS 文件执行 ESLint，并运行以下相关 Jest（测试路径按最终落地文件调整）：

```sh
npx eslint packages/core/src/platform/createApp.ios.js packages/core/src/platform/createApp.js packages/webpack-plugin/lib/runtime/optionProcessor.js packages/api-proxy/src/platform/api/route/index.web.js packages/api-proxy/src/platform/api/route/index.ios.js packages/core/__tests__/rn/createApp.spec.js packages/webpack-plugin/test/runtime/web/option-processor.spec.js packages/api-proxy/__tests__/web/route.spec.js packages/api-proxy/__tests__/rn/route.spec.js
npm test -- --watchman=false --runInBand --runTestsByPath packages/core/__tests__/rn/createApp.spec.js packages/core/__tests__/web/implement.spec.js packages/webpack-plugin/test/runtime/web/option-processor.spec.js packages/api-proxy/__tests__/web/route.spec.js packages/api-proxy/__tests__/rn/route.spec.js packages/api-proxy/__tests__/web/app-event.spec.js packages/api-proxy/__tests__/rn/canIUse.spec.js
```

Jest 失败最多尝试 3 次修复，仍失败则停止并输出错误分析。集成验收补充 RN 实际宿主初始化与 Web 浏览器刷新/历史回退，不能以只有静态 mock 的单测替代导航就绪验证。

## 文档与 Skill 同步

实际实现属于新增跨端使用能力，须在代码落地的同一次改动中同步：

- `docs-vitepress/guide/basic/app.md`：补充触发边界、参数、首页回退、调用时机和回调内恢复示例。
- `docs-vitepress/guide/advance/platform.md`：明确 Web 仅入口缺失触发，路由 API 失败不触发。
- `docs-vitepress/guide/rn/application-api.md`：补充 RN 支持范围及 `parseAppProps` 的非法入口处理。
- `docs-vitepress/api/global-api.md`：从 RN 的 App `implement` 适配清单移除 `onPageNotFound`，保留 `onThemeChange`。
- `docs-vitepress/api-proxy/base/app/app-event/onPageNotFound.md` 与 `offPageNotFound.md`：新增独立 API 文档，同步侧边栏及 API 索引。
- `.agents/skills/mpx2rn/references/rn-api-reference.md`：补充两项 API 及目录索引。
- `.agents/skills/mpx2rn/references/rn-script-reference.md`：更新回调支持表与 `implement` 清单。
- `.agents/skills/mpx2rn/references/rn-config-reference.md`：补充缺失入口参数只进入通知、不会传入回退首页，以及根组件重建语义。

按 `docs-vitepress/AGENTS.md` 同步新增 API 页面的侧边栏和目录索引。已有业务通过 `implement('onPageNotFound')` 接入宿主通知的，升级后应移除重复驱动；不能继续依赖 `implement(..., { remove: true })` 对已原生支持的生命周期进行过滤。

## 实施顺序与已知限制

先实现 RN 入口记录与通知，再接通 Web 守卫到 App 实例的通知链路，随后补齐路由失败预校验和收尾，最后同步文档、Skill 并执行相关检查。

首页先初始化是本方案为复用现有启动流程作出的选择；若后续要求“首页完全不创建、回调前后严格复刻微信生命周期”，需要单独设计启动占位页或导航准备阶段，不应隐含扩大本次改动。微信真机与更长观察窗口验证可作为后续补充，不把尚未测得的行为写成兼容性保证。


## 实施验证记录

- 相关修改文件的 ESLint 通过。
- 相关 Jest 共 7 个套件、80 项测试通过，包括 RN createApp、Web implement 兼容性、Web 启动集成、两端 route API、应用事件 API 与 RN canIUse。
- Web 集成测试直接使用 Vue 2 与 Vue Router 3，覆盖 hash/history、恢复历史栈、异步首页、回调内跳转、SSR 与 `useSSR` 客户端启动。App 实例绑定和通知时机在该集成套件中验证，未另建重复的 core Web 测试文件。
- RN 使用真实 React 测试渲染器保留 Hook 状态，导航容器与原生模块使用 mock；覆盖根组件重渲染/重建、ready 去重、同步导航失败、回调重入和超时恢复。尚未运行 RN 真机或宿主容器验收，也未进行独立浏览器的人工验收。
- 修复了 SSR 默认启动路径中入口重定向造成的未处理 Promise rejection：`router.push` 使用回调形式，由 `router.onReady` 接收最终导航结果。
- 测试命令禁用 Watchman，以避免沙箱无法访问宿主 Watchman 状态目录。Jest 仍输出仓库现有的 `testTimeout` 配置警告，不影响上述通过结果。
