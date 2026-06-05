# RN 运行时按需测速 {#rn-runtime-perf-probe}

Mpx 跨端输出 React Native 时，运行时核心组件（`mpx-view` / `mpx-text` / `mpx-simple-view` / `mpx-simple-text` 等）以及 `useTransformStyle` / `__getStyle` 等公共函数是高频热路径，在大列表、复杂样式、嵌套文本场景下经常成为性能瓶颈。Hermes Profiler / Flipper 只能看到 RN 原生层调用栈，难以定位到 `splitStyle`、`useTransformStyle`、`wrapChildren` 这些 mpx 自身逻辑。

`@mpxjs/perf` 是 Mpx 内置的运行时测速探针，提供「需要时打开、不需要时关闭、关闭态产物零字节残留」的能力，作为 mpx 抽象层的 mark / measure 数据源，与 Hermes Profiler / Flipper / Perfetto 等系统级工具互补。

## 设计原则 {#design-principles}

`@mpxjs/perf` 采用「**编译期常量开关 + 运行时探针实现 + tree-shaking 兜底**」三层结构：

1. `MpxWebpackPlugin` 通过 `DefinePlugin` 注入一组 `__mpx_perf_*__` 字面量常量。
2. 探针调用包在 `if (__mpx_perf_framework__) ...` / `if (__mpx_perf_user__) ...` 字面量条件里。
3. Terser 把 `if (false) {...}` 整段消除，`@mpxjs/perf` 包内的 `impl` / `bus` / `reporters` 模块在 webpack tree-shaking 阶段被剔除。

最终：**关闭态下产物里既不存在探针代码，也不存在事件名字符串字面量，对 bundle size 与运行时性能均无任何影响**。

**实时聚合 only**：录制窗口内只维护 `Map<name, AggResult>`，不保留逐条事件。push 阶段直接累加，end 时回填 `avg`。GC / 内存压力近乎为零，专门为高频渲染场景（大列表 / 嵌套文本）下的"测速本身不影响被测对象"设计。

::: warning 该方案不支持线上动态开关
线上开关意味着探针字节必须进入产物，与「关闭态零残留」目标冲突。线上诊断需重新打一个**开启探针的内测包**。
:::

## 配置入口 {#config}

在 `mpx.config.js` 的 `pluginOptions.mpx.plugin` 下新增 `perf` 字段（与 `MpxWebpackPlugin` 其他选项同级）：

```js
// mpx.config.js
const { defineConfig } = require('@vue/cli-service')

module.exports = defineConfig({
  pluginOptions: {
    mpx: {
      plugin: {
        perf: {
          enable: !!process.env.MPX_PERF,  // 用环境变量控制内测构建
          probes: ['framework', 'user']
        }
      }
    }
  }
})
```

### 配置项说明 {#config-options}

| 字段 | 类型 | 说明 |
| --- | --- | --- |
| `enable` | `boolean` | 总开关。`false` 或不传 `perf` → 整套探针关闭，产物零残留。 |
| `probes` | `string[]` | 要打开的分组列表。当前支持 `'framework'` / `'user'` 两个分组。`enable: true` 但 `probes: []` 等价于 `enable: false`。出现未知分组名（typo）时编译期直接抛错。 |

### 分组开关的语义 {#groups}

| 分组 | 控制对象 | 典型用法 |
| --- | --- | --- |
| `framework` | 框架内部探针（`view:render:*` / `text:render:*` / `getStyle:*`） | 调试 mpx 框架自身渲染性能 |
| `user` | 业务侧自定义探针（业务前缀如 `myBiz:list:filter`） | 定位业务函数耗时 |

两个分组的开关粒度独立、产物 DCE 独立，但**共用同一根聚合 Map 与 reporter**——业务侧 reporter 可同时收到所有桶，按 name 前缀区分。

| 配置 | 行为 |
| --- | --- |
| `{ enable: true, probes: ['framework'] }` | 只采集框架探针，业务噪声不干扰基线 |
| `{ enable: true, probes: ['user'] }` | 只采集业务探针，专注定位业务函数耗时 |
| `{ enable: true, probes: ['framework', 'user'] }` | 全量诊断，看完整调用链 |

## 业务侧使用 {#usage}

### 最小用法（默认 reporter） {#minimal}

`@mpxjs/perf` 的默认 reporter 即 `consoleReporter`——业务方什么都不调，开启探针并 `start()` / `end()` 后 console 就有聚合输出，**零接入门槛**。

```ts
import { start, end } from '@mpxjs/perf'

// 路由钩子：进入"商品详情"页 → 离开页面
router.beforeEnter('/goods/:id', () => {
  if (__mpx_perf__) start()
})

router.beforeLeave('/goods/:id', () => {
  if (__mpx_perf__) end()  // end 内部同步触发 reporter，console 立即看到聚合表
})
```

输出样例（对齐字符串，跨 RN / 浏览器 / Node 显示一致）：

```
[mpx perf] 4 buckets / 432 samples
name                count       sum      avg       max
------------------  -----  --------  -------  --------
view:render:total     120  480.32ms   4.00ms   18.21ms
view:render:style     120   92.15ms   0.77ms    3.42ms
getStyle:total        120   21.08ms   0.18ms    1.10ms
text:render:total      84    8.42ms   0.10ms    0.55ms
```

> 默认 reporter 不使用 `console.table`——React Native 远程调试 / Hermes inspector 对它支持参差不齐（典型表现是把每行渲染成 `{…}` 不展开），改成对齐字符串 + 单条 `console.log`，在 RN console、Chrome DevTools、终端 Node 中都能直接读。

### 指标含义 {#metrics}

| 指标 | 含义 | 用途 |
| --- | --- | --- |
| `count` | 录制窗口内该事件触发次数 | 估算频率，例如 `view:render` 在窗口内 120 次说明列表在抖 |
| `sum` | 总耗时（ms） | 看占帧预算比例（一秒 = 16.67ms × 60 帧） |
| `avg` | 平均耗时（ms） | 单次成本基线 |
| `max` | 最大耗时（ms） | 长尾尖刺 |

`avg` 仅在 `end()` 时一次性回填，`push` 阶段不做除法。

### 三种 start / end 调用模板 {#start-end-patterns}

#### 路由钩子 {#pattern-router}

```ts
router.beforeEnter('/goods/:id', () => {
  if (__mpx_perf__) start()
})
router.beforeLeave('/goods/:id', () => {
  if (__mpx_perf__) end()
})
```

#### 交互按钮 {#pattern-button}

```ts
const onSubmit = () => {
  if (__mpx_perf__) start()
  doSubmit()  // 内部触发若干 mpx-view 重渲染、setState
  if (__mpx_perf__) end()
}
```

#### React 组件挂载窗口 {#pattern-effect}

```ts
useEffect(() => {
  if (__mpx_perf__) start()
  return () => { if (__mpx_perf__) end() }
}, [])
```

### 自定义 reporter（可选） {#custom-reporter}

如果想把数据接到自家 APM、写文件、发本地 socket，调 `setReporter` 替换默认 console。reporter 收到的就是已聚合的 `Map<name, AggResult>`：

```ts
// App.tsx
import { setReporter } from '@mpxjs/perf'
import type { AggResult } from '@mpxjs/perf'

if (__mpx_perf__) {
  setReporter((agg: Map<string, AggResult>) => {
    // agg 是 bus 内部 Map 的引用，不要直接修改；如需保留请自行复制成普通对象。
    const fw: Record<string, AggResult> = {}
    const user: Record<string, AggResult> = {}
    const FW_PREFIX = /^(view:|simple-view:|text:|simple-text:|getStyle:)/
    for (const [name, s] of agg) {
      if (FW_PREFIX.test(name)) fw[name] = s
      else user[name] = s
    }
    MyAPM.report('mpx_perf_fw', fw)
    MyAPM.report('mpx_perf_user', user)
  })
}
```

::: warning 注册时机
`setReporter` 必须用 `if (__mpx_perf__)` 包住——总开关为 false 时整段被 DCE 删除，自定义 reporter 函数 + 闭包字节也一并消失。

**不要**写成 `setReporter(__mpx_perf__ ? myFn : undefined)`——`myFn` 引用没被字面量条件包裹，仍可能被 webpack 视作活引用。
:::

::: warning Map 引用语义
`reporter` 收到的 Map 是 bus 内部窗口数据的引用，**不要在 reporter 内修改它**。下一次 `start()` 会重建新 Map（旧引用归调用方私有，业务侧异步消费安全），但若 reporter 在当次调用里改桶值，会污染同批次的局部 reporter。
:::

切换 reporter 直接再调一次 `setReporter(otherReporter)`。想完全停止上报，调 `clearReporter()`——之后 `end()` 收集到的桶被静默丢弃。

如果只想在某一次录制窗口结束时追加一个局部 reporter，可以直接传给 `end(localReporter)`。局部 reporter 与全局 reporter **不互斥**：默认 `consoleReporter` 或 `setReporter` 注册过的全局 reporter 会照常收到同一份 Map，局部 reporter 只在这次 `end` 调用中额外触发一次，不会改变后续窗口的全局配置。

```ts
import { start, end } from '@mpxjs/perf'

const onSubmit = () => {
  if (__mpx_perf__) start()
  doSubmit()
  if (__mpx_perf__) {
    end((agg) => {
      MyAPM.report('submit_perf', agg)
    })
  }
}
```

### 自定义 console 输出 {#custom-console}

默认 console 不满足时，调 `createConsoleReporter` 工厂定制：

```ts
import { setReporter, createConsoleReporter } from '@mpxjs/perf'

if (__mpx_perf__) {
  setReporter(createConsoleReporter({
    sortBy: 'max',          // 'sum'(默认) | 'avg' | 'max' | 'count'
    filter: /^view:/,       // 仅打印匹配的事件名
    header: true            // 是否带 console.group 头
  }))
}
```

::: tip 高阶统计的取舍
本方案实时聚合 only，**不保留**逐条事件数组——因此**无法**在录制窗口结束后再计算 p50 / p95 / 直方图等分位指标。如需分位数，请用业务自定义探针在调用点自行采样，或在 reporter 中按桶名做二次累加。

设计上的取舍：高频渲染场景下保留逐条事件会显著放大 GC 压力（每次 scope ≈ 1 事件对象 + 1 闭包），与「测速本身不影响被测对象」的目标冲突，因此选择仅保留聚合。
:::

## 业务侧自定义探针 {#user-probes}

业务侧自有 RN 代码（非 `.mpx` 的纯 RN 封装、列表项、外置 hook 等）想接入同一根 reporter 通道时，使用 `__mpx_perf_user__` 分组开关 + `scopeStart` / `scopeEnd` 句柄式 API：

```ts
import { scopeStart, scopeEnd } from '@mpxjs/perf'

function expensiveCompute (data) {
  let id = -1
  if (__mpx_perf_user__) id = scopeStart('myBiz:list:filter')
  const result = data.filter(/* ... */).sort(/* ... */)
  if (__mpx_perf_user__) scopeEnd(id)
  return result
}
```

事件名建议加业务前缀（`myBiz:` / 模块名 / 业务线代号）以与框架的 `view:` / `text:` / `getStyle:` 区分。

### 为什么是 scopeStart / scopeEnd 而不是闭包 {#why-handle}

`scopeStart(name)` 返回的是一个 `number` 句柄而非闭包：

- 录制态：内部从 freeList 取一个 id，写入两个数组下标（name + start 时间），返回 id。**零对象 / 零闭包分配**。
- 未录制：直接返回 `-1`，不调 `now()`、不写数组。`scopeEnd(-1)` 是安全 noop。

这是为高频渲染场景特别设计的——一帧 1000+ 次 scope 调用下，旧的闭包模式会产生 1000+ 个闭包 Context 对象，显著放大 GC 压力，让测速本身变成被测项的瓶颈。

### 强约束 {#user-probe-constraints}

1. **字面量条件**：所有探针调用必须直接包在 `if (__mpx_perf_framework__)`（框架探针）/ `if (__mpx_perf_user__)`（业务探针）字面量条件里——不能先把常量赋给变量再用。只有字面量条件才能被 DefinePlugin + Terser DCE 静态消除。
2. **scopeStart / scopeEnd 必须配对**：用 `let id = -1` 提前声明，再 `if (...) id = scopeStart(...)` / `if (...) scopeEnd(id)`——这样关闭态下整组语句被 DCE 删除。**不要**写成 `const id = <常量> ? scopeStart(...) : -1`，那会把字面量字符串和分支保留在产物里。
3. **不要跨类混用**：业务代码里只用 `__mpx_perf_user__`，不要错用 `__mpx_perf_framework__`（反之亦然）。

## API 参考 {#api}

| API | 说明 |
| --- | --- |
| `scopeStart(name): number` | 起一段 scope，返回 id 句柄。未录制时返回 `-1`。**首选**。无闭包 / 对象分配。 |
| `scopeEnd(id): void` | 关闭 id 对应的 scope，累加进聚合。`id < 0` 或重复 end 安全 noop。 |
| `mark(name)` | 仅打一个时间戳，**不进聚合**。跨作用域起止配对时使用。 |
| `measure(name, start)` | 与 `mark(start)` 配对，记录从 mark 到当前的样本进聚合。mark 用过即清。 |
| `start()` | 打开录制窗口；新建一个干净的聚合 Map。重复 `start` 幂等。 |
| `end(reporter?)` | 关闭录制窗口，回填 `avg = sum/count` 后**同步**把 `Map<name, AggResult>` 交给全局 reporter；传入局部 reporter 时同批次追加触发一次。 |
| `setReporter(r)` | 替换默认 reporter。可选，默认即 `consoleReporter`。 |
| `clearReporter()` | 清空 reporter；之后 `end` 收集到的聚合结果被静默丢弃。 |
| `createConsoleReporter(opts?)` | 工厂函数，定制 console 输出。 |
| `consoleReporter` | 默认 reporter，等价于 `createConsoleReporter()` 默认参数。 |

`Reporter` 签名：`(agg: Map<string, AggResult>) => void`。
`AggResult`：`{ count, sum, avg, max }`，所有时长字段单位为 ms。

### 录制窗口语义 {#recording-window}

- **`start()` / `end()` 之间触发的探针才会被录制**，其余时间所有 `scopeStart` / `mark` 调用立即 return（`scopeStart` 返回 `-1`），零内存占用。
- **`end()` 同步触发 reporter**：调用 `end()` 那一行之后立即在 console 看到结果，调试切场景手感顺；`end(localReporter)` 不会替换全局 reporter，只对当前窗口追加一次局部上报。
- **不强制配对**：误调 `end()`（未先 start）是 noop；重复 `start()` 沿用已有窗口（幂等）。
- **强制重开新窗口**：先 `end()` 再 `start()`，第二次 `start` 会丢弃旧聚合并新建一个空 Map。
- **跨窗口的 Map 引用是安全的**：每次 `start()` 都新建 Map，所以 reporter 异步消费旧窗口的 Map 不会被下一次窗口覆盖。
- **不需要 `try / finally` 保护 end**：忘记 end 不会导致内存泄漏（聚合 Map 桶数 = 唯一事件名数量，业务侧名集合通常有限）。

## 内置框架探针事件 schema {#schema}

首版接入了四个内建组件 + 一个 core mixin 方法。统一只测**同步 render 耗时**（不含 `useEffect`、不含 commit 后副作用），每个组件至少产出一个 `*:render:total`，加若干 `*:render:<phase>`——子阶段相加 ≈ total，差值代表函数自身骨架开销。

### `mpx-view` {#schema-view}

| 事件名 | 覆盖代码段 |
| --- | --- |
| `view:render:total` | 整个 `forwardRef` 回调（最外层，含子阶段） |
| `view:render:props` | `splitProps` + 解构 + `useHover` |
| `view:render:style` | `useTransformStyle` + `splitStyle` + `useTextPassThroughValue` + `useLayout` + `useAnimationHooks` |
| `view:render:innerProps` | `useInnerProps` |
| `view:render:createElement` | `wrapWithChildren` + `createElement(View / Animated.View / GestureDetector / Portal)` 收尾 |

### `mpx-simple-view` {#schema-simple-view}

| 事件名 | 覆盖代码段 |
| --- | --- |
| `simple-view:render:total` | 整个函数 |
| `simple-view:render:style` | `splitProps` + `splitStyle`（含 `isBoxSizingAffectingStyle` 副检测）+ `useTextPassThroughValue` + `transformBoxSizing` |
| `simple-view:render:innerProps` | `useInnerProps` |
| `simple-view:render:createElement` | `wrapChildren` + `createElement(View, ...)` 收尾 |

### `mpx-text` {#schema-text}

| 事件名 | 覆盖代码段 |
| --- | --- |
| `text:render:total` | 整个 `forwardRef` 回调 |
| `text:render:props` | `useContext(TextPassThroughContext)` + `extendObject` 合并 inherited + 解构 |
| `text:render:style` | `useTransformStyle` + 合并 inherited textStyle + `splitStyle`（提取 childTextStyle）+ `useTextPassThroughValue` + `useNodesRef` |
| `text:render:innerProps` | `useInnerProps` |
| `text:render:createElement` | `decode` + `wrapChildren` + `createElement(Text / Portal)` 收尾 |

### `mpx-simple-text` {#schema-simple-text}

| 事件名 | 覆盖代码段 |
| --- | --- |
| `simple-text:render:total` | 整个函数 |
| `simple-text:render:style` | `useContext(TextPassThroughContext)` + 合并 mergedStyle + `splitStyle` + `transformBoxSizing` + 合并 mergedProps + `useTextPassThroughValue` |
| `simple-text:render:innerProps` | `useInnerProps`（带 allowFontScaling / 最终 style） |
| `simple-text:render:createElement` | `wrapChildren` + `createElement(Text, ...)` 收尾 |

### `@mpxjs/core: __getStyle` {#schema-getstyle}

`__getStyle` 是每个 mpx 组件 render 时都会被调一次的样式聚合入口，是除内建组件外测速的核心入口：

| 事件名 | 覆盖代码段 |
| --- | --- |
| `getStyle:total` | 整个 `__getStyle` 函数 |
| `getStyle:class` | classString 解析 + 遍历 `__getClassStyle` / `__getAppClassStyle` / externalClasses 查找 |
| `getStyle:style` | `parseStyleText(staticStyle)` + `normalizeDynamicStyle(dynamicStyle)` + `transformStyleObj(styleObj)` |

## 性能影响评估 {#perf-impact}

| 状态 | 关闭 | 打开 + 未录制（未 start） | 打开 + 录制中 |
| --- | --- | --- | --- |
| 单次 scope 额外耗时 | 0 | 一次 `isRecording()` 比较 → return | 状态判断 + freeList 取 id + 一次 `now()` + 两次数组下标写 + push 阶段 `Map.get` + 数值累加 |
| 单次 scope 堆分配 | 0 | 0 | 0（首次出现新桶时一次 `AggResult` 对象） |
| 内存 | 0 | 0（scopeStart 返回 -1 即终止） | 桶数 × `AggResult`（~40 字节）。桶名通常有限，远低于事件流模型 |
| Hook 调用顺序 | 不变 | 不变（同一构建内常量恒定） | 不变 |
| reporter 触发开销 | 无 | 无 | 仅 `end()` 触发一次同步调用，不在热路径上重复跑 |

::: tip 实时聚合 vs 事件流模型
旧版（事件流）每次 scope 产生 1 个事件对象 + 1 个 stop 闭包，一帧 1000+ 次 scope 直接累积 2000+ 个短命对象，触发 Hermes minor GC。本版（实时聚合）单次 scope 在录制态下零对象分配，桶数稳态后甚至零分配总量——测速本身对热路径的影响接近忽略不计。
:::

::: warning 观测者效应
打开态测得的耗时本身仍含探针自身开销（一次 `now()` + 数组下标写 + Map 累加）。**对比应当在同一开关态下进行**——不要拿打开态数据 vs 关闭态线上数据做绝对对比。
:::

## 与现有方案的关系 {#vs-others}

- **vs `__DEV__`**：`__DEV__` 区分开发 / 生产环境，无法支持「生产构建里临时开探针」；`__mpx_perf_*__` 是构建参数，可以打一个生产 + 开探针的内测包。
- **vs Hermes Profiler**：Hermes 看 JS 函数级耗时，看不到 mpx 抽象（`useTransformStyle` 内部是若干小函数 + Hook，非单一函数）。本方案产生的 scope 时间戳与 Hermes 时间轴对齐（都用 `performance.now()` / `nativePerformanceNow`），可以一起分析。
- **vs 既有 APM**：本方案不替代业务 APM，只提供数据源；业务可用自定义 reporter 把聚合结果接入既有上报通道。

## Terser / babel 兼容性约束 {#terser-babel}

- `@mpxjs/perf` 以**未压缩、未编译**源码形式被引用，使用方 webpack 的 ts-loader / babel-loader + Terser 在最终构建里完成 DCE。
- 接入方需保留默认 Terser 配置（不要关闭 minimizer / 不要禁用 `dead_code` / `conditionals`）。
- `babel-preset-env` 不要把三元条件 `__mpx_perf__ ? impl.x : noop.x` 变换平铺，否则 DCE 失效。
