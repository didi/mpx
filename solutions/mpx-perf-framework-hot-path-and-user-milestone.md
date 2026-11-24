# Mpx 跨端框架热路径与用户节点性能上报方案

## 结论

将 `@mpxjs/perf` 从以 RN 为主的运行时探针扩展为小程序、Web、RN 共用的性能采集能力。

新增的统一指标只描述 Mpx 语义，不携带 `mini`、`web`、`rn` 等平台前缀。平台差异由 Reporter 结合编译期常量 `__mpx_mode__` 识别；某些指标可以只在部分平台产生，但不因此建立另一套平台前缀命名。

首期只采集能够直接定位框架热路径的少量指标：

| 指标 | 小程序 | Web | RN | 含义 |
| --- | --- | --- | --- | --- |
| `instance:init` | 是 | 是 | 是 | 实例 state 初始化 |
| `instance:init:setup` | 是 | 是 | 是 | 用户 `setup()` 同步执行 |
| `instance:render` | 是 | 是 | 是 | 平台 render 同步执行；小程序 vnode 分支不采集 |
| `instance:render:getStyle` | 否 | 否 | 是 | RN `__getStyle` 同步执行 |
| `instance:render:getStyle:class` | 否 | 否 | 是 | RN class 样式解析 |
| `instance:render:getStyle:style` | 否 | 否 | 是 | RN inline style 解析 |
| `instance:unmount` | 是 | 是 | 是 | 实例核心卸载 |
| `scheduler:flush` | 是 | 否 | 是 | 一次 Mpx scheduler 完整 drain |
| `lifecycle:<hook>` | 按支持情况 | 按支持情况 | 按支持情况 | 一次 Page / Component 生命周期调度 |
| `lifecycle:app:<hook>` | 按支持情况 | 按支持情况 | 按支持情况 | 一次用户定义的 App 生命周期执行 |

`instance:render` 仅在 RN 下保留 `getStyle` 子阶段，不再继续拆分 render data 预处理、`setData` 同步调用或基础组件内部步骤。基础组件使用独立命名：`<component>:render` 表示父阶段整体耗时，`<component>:render:<phase>` 表示内部子阶段。RN 保留现有 view/text/simple-view/simple-text 并增加 image/scroll-view，Web 增加 view/text/image/scroll-view。

## 目标与非目标

目标：

1. 同一套 `perf` 配置可用于小程序、Web 和 RN。
2. Reporter 在三端接收相同的数据结构和稳定的低基数指标名。
3. `init`、`setup`、`render effect`、`unmount` 使用跨端一致的语义。
4. 框架关闭时，探针代码、模块依赖和指标字符串在三端最终产物中零残留。
5. 不改变小程序/Vue 生命周期顺序和 React Hooks 调用顺序。

非目标：

1. 不提供 GPU 首帧、FPS、原生布局、网络和图片下载指标。
2. 不在指标名中加入 route、组件路径、实例 uid、props 或 query。
3. 不自动调用 `start()` / `end()`，录制窗口仍由业务控制。
4. 不包装所有 methods、event、watch 或响应式 getter。
5. 不尝试把平台底层实现耗时强行解释为可直接横向比较的数据。

## 统一命名

### Measure

```text
instance:init
instance:init:setup
instance:render
instance:render:getStyle
instance:render:getStyle:class
instance:render:getStyle:style
instance:unmount
scheduler:flush
lifecycle:<hook>
lifecycle:app:<hook>
```

`instance:render` 表示一次平台渲染链路的同步执行。RN 的 `getStyle` 指标是它的子阶段，不能与父指标相加。

基础组件指标：

| 指标 | 小程序 | Web | RN |
| --- | --- | --- | --- |
| `view:render` | 否 | 新增 | 已有 |
| `text:render` | 否 | 新增 | 已有 |
| `image:render` | 否 | 新增 | 新增 |
| `scroll-view:render` | 否 | 新增 | 新增 |
| `image:render:props` | 否 | 否 | 新增 |
| `image:render:style` | 否 | 否 | 新增 |
| `image:render:innerProps` | 否 | 否 | 新增 |
| `image:render:createElement` | 否 | 否 | 新增 |
| `scroll-view:render:props` | 否 | 否 | 新增 |
| `scroll-view:render:style` | 否 | 否 | 新增 |
| `scroll-view:render:innerProps` | 否 | 否 | 新增 |
| `scroll-view:render:createElement` | 否 | 否 | 新增 |

RN 已有的 simple-view、simple-text 父阶段和子阶段指标保持不变，`getStyle` 指标迁入 `instance:render:getStyle` 层级。基础组件父阶段指标虽然在 Web/RN 复用相同名称，但底层实现不同，仍通过 `__mpx_mode__` 分平台建立基线。

平台只作为上报上下文：

```js
import { setReporter } from '@mpxjs/perf'

if (__mpx_perf__) {
  setReporter((measures, timeline) => {
    MyAPM.report(__mpx_mode__, measures, timeline)
  })
}
```

### Timeline mark

首期只保留低频 App/Page 用户节点：

```text
app:onLaunch:start
page:onLoad:start
page:onReady:start
```

三个节点都在对应生命周期开始前产生。`page:onReady:start` 只表示目标平台开始调度 Mpx `onReady` 对应生命周期，不代表统一的 GPU 首帧或可交互时间。

每条 mark 同时包含相对时间和绝对时间：

```ts
interface MarkEvent {
  name: string
  // 相对当前 start() 的毫秒偏移
  at: number
  // Unix epoch 毫秒时间戳
  timestamp: number
  // mark() 调用方传入的自定义信息
  info?: unknown
}
```

`start`、显式 mark 和 `end` 都必须包含 `timestamp`。`at` 继续使用 `performance.now()` / `nativePerformanceNow()` 等单调时钟计算，负责窗口内耗时和排序；`timestamp` 在事件发生时通过 `Date.now()` 采集，用于与业务日志和 APM 时间线对齐；显式 mark 可通过 `info` 原样携带自定义信息。系统时钟发生调整时，数组顺序和 `at` 仍是窗口内时序的权威依据。

mark 只用于低频 App/Page 节点，增加一次 `Date.now()` 不影响 measure 热路径；不为 measure 样本保存绝对时间。`page:onLoad:start` 和 `page:onReady:start` 的 `info` 均传入当前页面 `{ route }`。

## 指标边界

### `instance:init`

统一边界为：

```text
beforeCreate 完成
→ 实例 state 初始化
→ created 开始
```

- 小程序/RN：覆盖 `initInject/Props/Setup/Data/Computed/Watch/Provide`。
- Web：覆盖 Vue 的 `initInjections → initState → initProvide`。
- Web 明确排除前置 `mergeOptions`、`initProxy/initLifecycle/initEvents/initRender`。
- 三端都排除 `beforeCreate` 和 `created` hook 主体。

Web 无法从外部只包裹 Vue 模块内静态调用的 `initState(vm)`，因此 `instance:init` 是不含 `mergeOptions` 的 state 初始化近似区间，不宣称是纯 `initState` 函数耗时。

### `instance:init:setup`

只包裹用户 `setup(props, context)` 的同步调用：

- 小程序/RN 在 `MpxProxy.initSetup()` 中采集。
- Web 在 Vue 实际调用的 `rawSetup` 外层采集。
- 不包含 context 准备、结果校验、响应式转换和实例 proxy。
- 没有 setup 的实例不产生样本。
- 它是 `instance:init` 的子阶段，不能与父指标相加。

不再增加 `user:data`、`user:provide` 等细分指标。

### `instance:render`

统一表示各平台一次 render 的同步执行过程：

| 平台 | 开始 | 结束 | 排除 |
| --- | --- | --- | --- |
| 小程序 | 非 vnode `ReactiveEffect` 主函数进入 | 主函数正常返回 | vnode 分支、宿主异步 `setData` callback |
| Web | 当前 Mpx 实例的 Vue `_render` 进入 | `_render` 返回 VNode | Vue `_update`、patch、DOM |
| RN | `__injectedRender` 进入 | 返回 React element tree | 外层 React render、commit、Native layout |

约束：

- 小程序非 vnode `ReactiveEffect` 主函数真实执行一次才产生一个样本。
- Web 只在框架性能开关开启时代理 `Vue.prototype._render`，并仅采集带 `__mpxProxy` 的实例。
- Web `<template name>` 生成但不带 `__mpxProxy` 的内部模板组件不单独产生实例 render 指标。
- RN 探针放在已有 `ReactiveEffect` 内，不新增或条件调用 Hook；`useMemo` 命中且模板未执行时不产生样本。
- 该指标不代表宿主异步提交完成、首帧或可交互完成。

不采集 `setData` 调用到 callback 的异步耗时，该阶段受宿主调度影响，无法与同步指标简单累加。

### 基础组件 render

Web 对 `mpx-view`、`mpx-text`、`mpx-image`、`mpx-scroll-view` 只采集 render 函数同步总耗时：

```text
view:render
text:render
image:render
scroll-view:render
```

- view 覆盖 hover 数据和 listener data 生成及 VNode 创建。
- text 覆盖 slot/space/decode 处理及 VNode 创建。
- image 覆盖 mode/style/listener data 生成及 VNode 创建。
- scroll-view 覆盖 listener data、refresher 分支和滚动内容 VNode 树创建。
- 四者都排除 Vue scheduler、patch、DOM layout/paint。
- image 还排除预加载、网络、解码和 load/error 回调。
- scroll-view 还排除 BetterScroll 初始化、MutationObserver/ResizeObserver、滚动事件及 refresh/layout 读取。

RN 保留现有 view/text/simple-view/simple-text/getStyle 指标，并为 `mpx-image.tsx` 增加：

```text
image:render
image:render:props
image:render:style
image:render:innerProps
image:render:createElement
```

`image:render` 作为父阶段，覆盖一次 React Image 函数组件同步执行；子阶段分别沿用现有 view/text 的 props 归一化、style/layout 计算、innerProps 生成和 element 构造口径。它们排除 `useEffect` 回调、图片获取/解码、`onLayout`、React commit 和 Native layout。

RN image 的 `scopeStart/scopeEnd` 不是 Hook，可以放在现有 Hook 调用前后；所有 `useMemo/useState/useRef/useEffect` 必须继续无条件按原顺序调用，不能进入 perf 条件分支或被移动。Web/RN 的 `:render` 父阶段都是组件级 inclusive time，与父模板 render 或子阶段不能相加。

RN `mpx-scroll-view.tsx` 增加：

```text
scroll-view:render
scroll-view:render:props
scroll-view:render:style
scroll-view:render:innerProps
scroll-view:render:createElement
```

`scroll-view:render` 作为父阶段，覆盖一次 ScrollView React 函数组件的同步执行；子阶段沿用现有 view/image 的 props、style/layout、innerProps 和 element tree 构造口径。style 阶段还包含状态、effect 注册、事件处理器和动画样式准备，createElement 阶段包含 `panGesture` 创建。它们排除 effect 回调、手势 worklet 后续执行、滚动事件、React commit、Native layout 和实际滚动。所有 Hook 均保持无条件、固定顺序调用。

### `instance:unmount`

统一边界为：

```text
beforeUnmount / beforeDestroy 完成
→ 实例核心资源释放
→ unmounted / destroyed 开始
```

- 小程序/RN：覆盖 effect scope stop 和 render update 失活。
- Web：覆盖父子引用移除、effect scope stop、observer 计数和 vnode teardown。
- 排除前后用户 lifecycle hook。
- Web keep-alive 的 `deactivated` 不产生该指标。
- Web 父实例卸载可能同步包含子实例卸载，因此它是按实例统计的 inclusive time，不能把组件 `sum` 当作页面卸载总耗时。

### Lifecycle 与 Scheduler

`MpxProxy.callHook()` 只在存在真实 option hook 或 composition hook 时采集 `lifecycle:<hook>`。三端 App 入口统一包装第一次 `transferOptions()` 产出的 `rawOptions`，只统计用户 options 与用户 mixin 合并后的 App hooks，不包含框架内建 mixin，并使用 `lifecycle:app:<hook>`，例如 `lifecycle:app:onLaunch`、`lifecycle:app:onShow`。

`scheduler:flush` 从 `queueFlush()` 创建的实际 flush callback 进入时开始，覆盖 queue 排序、有效 job、post-flush callback 以及递归新增任务，直到队列完整 drain。递归 `flushJobs()` 自然包含在外层 callback 内，不需要额外记录深度；同步 `forceFlushSync` 和 Promise 调度使用相同边界，异步排队等待不计入耗时。

不再单独采集 job、pre callback 或 post-flush 阶段，避免包含关系造成聚合误读和增加热路径探针开销。Web 视图主要由 Vue scheduler 驱动，因此不产生该指标；它只表示 JS 调度任务完成，不代表小程序 `setData`、React commit 或视图提交完成。

## 删除、保留与迁移

移除以下现有或原计划指标，不双写：

| 旧指标 | 处理 |
| --- | --- |
| `proxy:created` | 由边界更窄的 `instance:init` 替代 |
| `proxy:unmounted` | 由 `instance:unmount` 替代 |
| 所有 `mini:*`、`web:*`、`rn:*` 方案指标 | 移除平台命名 |
| Web mount/update total | 不采集 |
| RN React render total | 不采集 |

`proxy:*` 的新旧边界不同，已有看板和告警需要切换桶名并重新建立基线，不能沿用原阈值。

以下 RN 基础组件指标原样保留，并新增 image 与 scroll-view 的父阶段和子阶段：

```text
view:render
view:render:<phase>
simple-view:render
simple-view:render:<phase>
text:render
text:render:<phase>
simple-text:render
simple-text:render:<phase>
image:render
image:render:<phase>
scroll-view:render
scroll-view:render:<phase>
```

它们继续用于 RN 内建组件诊断，不纳入跨端 `instance:render:*` 层级，也不在本方案中继续细分或重命名。样式处理指标迁入 `instance:render:getStyle`、`instance:render:getStyle:class` 和 `instance:render:getStyle:style`。

## 平台接入

### 公共路径

- `packages/perf/src/impl.ts`、`bus.ts`、`types.ts`
  - 为 start/mark/end 事件增加绝对 `timestamp`，保留相对 `at`。
- `packages/perf/src/reporters/console.ts`
  - timeline 同时展示 `at` 和 `timestamp`。
- `packages/core/src/core/proxy.js`
  - 移除 `proxy:*`。
  - 接入小程序/RN 的 init、setup、unmount。
  - 接入 lifecycle 和页面 ready mark。
- `packages/core/src/observer/scheduler.js`
  - 接入 `scheduler:flush` 总耗时。

### 小程序

- 在 `MpxProxy.initRender()` 链路接入 `instance:render`。
- 在 App 和 page status mixin 接入同名 lifecycle、onLaunch/onLoad/onReady mark。

### Web

- 在 `getDefaultOptions.web.js` 的 root mixin 生命周期中接入：
  - `instance:init`
  - `instance:init:setup`
  - `instance:unmount`
- 在 `vuePlugin.js` 中按需代理 `Vue.prototype._render`，接入 `instance:render`。
- 在 `components/web/mpx-view.vue`、`mpx-text.vue`、`mpx-image.vue`、`mpx-scroll-view.vue` 接入对应 `render` 父阶段。
- 不包装 Vue `_init`、`$destroy` 或私有 patch 函数。

### RN

- 在 `getDefaultOptions.ios.js` 已有 `ReactiveEffect` 中紧贴 `__injectedRender` 接入 `instance:render`。
- init、setup、unmount 复用 `MpxProxy` 公共路径。
- 保留 RN 内建组件原有探针，将 getStyle 探针迁入 `instance:render:getStyle` 层级，在 `mpx-image.tsx` 增加 `image:render` 父阶段与子阶段，在 `mpx-scroll-view.tsx` 增加 `scroll-view:render` 父阶段与子阶段。
- 所有 Hook 保持无条件调用和渲染间固定顺序，effect cleanup 顺序不变。

## 上报与开关

继续复用现有 API 和分组：

- 框架内置探针：`__mpx_perf_framework__`
- 业务手写探针：`__mpx_perf_user__`
- 录制与 Reporter：`__mpx_perf__`

框架内部采集用户 setup 或 lifecycle 仍属于 `framework` probe，因为分组表示探针代码归属，而不是被测函数作者。

所有指标名必须是静态字符串，并位于 `__mpx_perf_framework__` 可静态消除的分支内。同步路径依赖框架既有容错，在正常返回后显式结束 scope。

## 测试与验收

### 核心单测

1. 三端 init/setup/render effect/unmount 的正常路径边界和计数正确。
2. Web `instance:init` 不包含 `mergeOptions`，但包含实际执行的 setup。
3. 小程序 vnode 分支不产生 render effect 样本；其他 render effect 覆盖 `ReactiveEffect` 主函数从进入到正常返回。
4. Web `_render` 代理保持 `this`、参数、返回值和 SSR 行为，只采集带 `__mpxProxy` 的 Mpx 实例。
5. Web view/text/image/scroll-view 每次真实 render 产生一个父阶段样本，不包含 patch；image load/error、scroll-view observer/scroll/refresh 不增加 render 样本。
6. RN image 各分段边界正确，分支切换和 memo 命中不改变 Hook 顺序；异步图片加载和 layout 不计入父阶段。
7. RN scroll-view 每次真实 render 产生一个父阶段样本和四个子阶段样本，手势 worklet、滚动、effect callback 和 Native layout 不计入。
8. RN 模板 memo 命中时不增加 render effect count，且 Hook 顺序不变。
9. lifecycle 仅在真实 hook 存在时产生样本，App/Page mark 每实例只写一次。
10. start/mark/end 同时包含相对 `at` 和 Unix 毫秒 `timestamp`；mark 可保留自定义 `info`，两个 Page mark 携带 `{ route }`；系统时钟调整不影响事件数组顺序和相对耗时。
11. scheduler flush 覆盖递归 drain 且只产生一个总样本。
12. 最终产物和 Reporter 中不出现新规划的 `mini:*`、`web:*`、`rn:*` 指标；RN 现有 view/text/getStyle 与新增 image/scroll-view 指标正常输出。

### DCE

小程序、Web、RN 分别验证：

1. `perf` 关闭；
2. `probes: ['user']`；
3. `probes: ['framework']`；
4. `probes: ['framework', 'user']`。

关闭构建必须不存在 `@mpxjs/perf` 活模块、新增探针代码和指标字符串；不能以 RN 一端通过代替其他平台。

### 性能预算

每个平台分别比较 framework 关闭、开启未录制、开启并录制三种状态：

| 项目 | 验收 |
| --- | --- |
| 关闭态 | 新增字节、指标字符串、活模块为 0 |
| 开启未录制 | trimmed mean 相对关闭增幅不超过 3% |
| 开启录制 | trimmed mean 相对未录制增幅不超过 8% |
| measure 基数 | 不随 route、组件路径或实例数增加 |

## 实施顺序

1. 调整指标 schema，移除 `proxy:*` 和新规划的平台前缀指标，保留 RN 现有 view/text 指标并将 getStyle 迁入实例 render 层级。
2. 接入三端 init/setup/render/unmount。
3. 接入小程序/RN scheduler flush。
4. 接入 Web view/text/image/scroll-view 父阶段、RN image 与 scroll-view 的父阶段和子阶段。
5. 扩展 MarkEvent 绝对时间戳，接入 lifecycle 与 App/Page mark。
6. 更新 `packages/perf/README.md`、跨端性能文档及 RN Skill 参考。
7. 完成三端单测、DCE 和性能基准。

后续只有线上数据证明现有指标无法定位瓶颈时，才在 getStyle 之外新增一个边界明确的 `instance:render:<stage>`；不把 RN 现有组件内部子阶段迁入该层级。

## 回滚

1. `instance:init`、`instance:render`、`instance:unmount` 任一平台无法满足统一边界时，对该统一指标整体回滚，不能让同名指标表达不同完成阶段。
2. `scheduler:flush` 开销超预算时独立移除。
3. 基础组件分段开销超预算时优先保留 `<component>:render` 父阶段，移除子阶段。
4. 业务移除 `framework` probe 后，最终产物必须恢复零残留。
