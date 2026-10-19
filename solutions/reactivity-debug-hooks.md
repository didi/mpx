# Mpx 响应式调试 Hook 最小实现方案

本方案在 Mpx 自有响应式系统中增加 Vue 风格的开发态调试接口，支持小程序和 Mpx2RN。RD 可以在依赖收集或变化通知时暂停执行，借助开发者工具和现有 sourcemap 找到业务赋值位置。事件语义以 Vue 2.7 为参照，保留 Mpx 现有依赖关系、computed 缓存、watch 判断和更新调度行为。

状态：已实现，接口、测试与文档在本次改动中同步交付。适用范围：普通 Mpx 页面和组件，以及使用自有观察层的组合式响应式 API。

## 1 交付范围

实现以下接口：

- `onRenderTracked(callback)` 与 `onRenderTriggered(callback)`，在 `setup` 或 `<script setup>` 执行期间同步注册。
- `watch`、`watchEffect`、`watchSyncEffect`、`watchPostEffect` 的 `onTrack` / `onTrigger` 选项。
- `computed(getterOrOptions, debugOptions)` 的可选第二参数，支持 `onTrack` / `onTrigger`。
- TypeScript 类型、核心测试、小程序和 RN 验证示例，以及 API 文档和 RN Skill 同步。

开发态以现有 `process.env.NODE_ENV !== 'production'` / `isDev` 为依据，不新增构建配置或运行时开关。生产态接受相同 API 调用和参数，但不注册调试回调、不生成调试事件、不调用调试 Hook。

首版只提供上述组合式组件 Hook，不新增 Options API 的 `renderTracked` / `renderTriggered` 构造选项。现有 `$watch` 或选项式 watch 经公共 `watch` 转发的调试选项可自然生效；不扩展选项式 computed 的配置格式。

不增加自动录制器、依赖图、调用栈采集器、sourcemap 解析服务、调度关联 ID、提交追踪或模板位置元数据。`scheduler`、`nextTick`、原生 `setData` 回调和 React 提交时机保持现有行为。`__nativeRender__` 等未创建 Mpx 渲染 Effect 的路径不承诺组件调试事件；已有 watch / computed 自身的调试能力仍可使用。

## 2 当前实现与参考依据

| 当前入口 | 现有职责 | 本次接入 |
| --- | --- | --- |
| [observer/reactive.js](../packages/core/src/observer/reactive.js) | 属性 getter/setter、`set/del` | 在原收集和通知点传入事件信息 |
| [observer/array.js](../packages/core/src/observer/array.js) | 数组变更方法拦截 | 传入 `array mutation` 事件 |
| [observer/dep.js](../packages/core/src/observer/dep.js) | `depend` 收集、`notify` 通知订阅者 | 分发 effect 的 `onTrack/onTrigger` |
| [observer/effect.js](../packages/core/src/observer/effect.js) | 收集去重、依赖清理、执行和调度 | 保存开发态回调、隔离调试调用 |
| [observer/ref.js](../packages/core/src/observer/ref.js) | 用内部响应式 wrapper 实现 ref | 归一化调试 target/key |
| [observer/computed.js](../packages/core/src/observer/computed.js) | dirty 缓存、底层依赖转交 | debugOptions、computed 读取事件 |
| [observer/watch.js](../packages/core/src/observer/watch.js) | watch getter、job、scheduler | 首次执行前接上 debugOptions |
| [core/proxy.js](../packages/core/src/core/proxy.js) | 小程序渲染 Effect 和组件 Hook | 接上组件调试 Hook |
| [getDefaultOptions.ios.js](../packages/core/src/platform/patch/getDefaultOptions.ios.js) | RN 渲染 Effect 和 React 对接 | 在创建 Effect 后接同一组件 Hook |

Vue 2.7 参考文件：`src/core/observer/dep.ts`、`src/core/observer/index.ts`、`src/core/observer/array.ts`、`src/v3/reactivity/ref.ts`、`src/v3/reactivity/computed.ts`、`src/v3/apiWatch.ts`、`src/v3/debug.ts`。

Mpx 的 computed 会用 `effect.depend()` 将底层依赖转交给外层 Effect，接近 Vue 2.7 Watcher 的 `depend()`。本方案保留这一结构，不为了调试迁移到 Vue 3 的 Proxy、独立 computed Dep 或版本化依赖链。

公开接口的使用方式参考 [Vue 响应式调试说明](https://cn.vuejs.org/guide/extras/reactivity-in-depth#reactivity-debugging)。

## 3 API 与事件契约

### 3.1 类型声明

在 `packages/core/@types/index.d.ts` 增加：

```ts
export type TrackOpTypes = 'get' | 'touch'
export type TriggerOpTypes = 'set' | 'add' | 'delete' | 'array mutation'

export interface DebuggerEvent {
  /** 内部 ReactiveEffect 实例，供调试检查，不承诺其控制方法为公共 API。 */
  effect: any
  target: object
  type: TrackOpTypes | TriggerOpTypes
  key?: string | number | symbol
  oldValue?: any
  newValue?: any
}

export type DebuggerHook = (event: DebuggerEvent) => void

export interface DebuggerOptions {
  onTrack?: DebuggerHook
  onTrigger?: DebuggerHook
}

export function onRenderTracked(callback: DebuggerHook): void
export function onRenderTriggered(callback: DebuggerHook): void
```

`WatchEffectOptions` 继承 `DebuggerOptions`，`WatchOptions` 继续继承 `WatchEffectOptions`；全部 watch 重载自动获得这两个选项。`computed` 的只读和可写重载均增加 `debugOptions?: DebuggerOptions` 第二参数。类型在生产构建中也可用。

`effect` 是收到本次事件的订阅者。`target` 是发生读取或变更的响应式对象，通常不是组件实例。普通对象、数组和 ref 的 `target` 不统一包装成组件。`oldValue/newValue` 是当时的值或对象引用，不做深拷贝；稍后展开控制台中的对象可能看到后续变更。

### 3.2 事件信息

| 场景 | type | target | key | 值信息 |
| --- | --- | --- | --- | --- |
| 现有响应式属性读取 | `get` | 被读取的对象 | 属性名 | 不提供 |
| 已存在属性更新 | `set` | 被更新的对象 | 属性名 | 原 setter 的 oldValue/newValue |
| `set(obj, key, value)` 新增属性 | `add` | obj | 新属性名 | newValue |
| `del(obj, key)` 删除属性 | `delete` | obj | 删除的属性名 | 不额外读取旧属性 |
| 数组 `push/pop/shift/unshift/splice/sort/reverse` | `array mutation` | 数组自身 | 方法名，例如 `splice` | 不提供参数、旧数组或新数组 |
| 普通 `ref/shallowRef` 的 value 读取或赋值 | `get/set` | 业务持有的 ref | `value` | 赋值时提供值信息 |
| computed.value 读取 | `get` | computedRef | `value` | 不提供 |
| customRef 显式 track/trigger | `get/set` | customRef | `value` | 不暴露内部 version 的值 |

`touch` 保留 Vue 2.7 的类型兼容性，首版不新增仅为发出该事件而存在的订阅点。`childOb.dep.depend()`、`dependArray()`、computed 底层依赖转交等没有明确读取信息的调用保持原状，不额外补发 `get/touch`。

直接新增属性、直接数组索引赋值等现有观察层无法截获的操作，不会因为添加调试 Hook 而获得新响应能力。原有 setter 对相同值不通知时，也不发出 `onTrigger`。`triggerRef(shallowRef)` 按现有强制通知路径发出 `set/value`，不把自赋值伪装成值已变化；不改变普通 ref 的现有强制通知行为。

### 3.3 回调时机

`onTrack` 在当前 Effect 成功接受该依赖时同步调用。重复读取同一属性可以产生多个 `onTrack`，而订阅关系依然去重；Hook 次数不代表依赖数量。每次重新执行 getter 或渲染函数都会重新收集，旧分支依赖仍按原 `cleanupDeps()` 清理。

`onTrigger` 在 `Dep.notify()` 的订阅者快照中，对每个订阅者先同步调用其调试回调，再执行原来的 `update()`。此时通常仍保留业务赋值的同步调用栈。事件表示订阅者收到了通知，不表示 scheduler 已运行、watch callback 已执行、computed 结果已变化，或视图已提交。

paused 的 Effect 可以收到通知事件，随后按原逻辑延后执行；正常 stop 后已经取消订阅的 Effect 不再收到事件。调试功能保持原有通知顺序与次数，不顺便修正 ref 自动解包等路径中的通知差异。

## 4 观察层实现

### 4.1 Debug 元数据与生产态门禁

新增 `observer/debug.js`，仅放置 ref 的调试身份元数据和事件描述构造方法，不引入录制状态、时间戳、栈或全局强引用列表。

ref 身份使用开发态 WeakMap。每个普通 ref 的内部 wrapper 与公开 ref 均映射到同一份 `{ target: publicRef, key: 'value' }` 元数据；这样 customRef 可以把私有 version ref 的元数据 target 改成最终 customRef，并标记省略版本 oldValue/newValue。这只是调试描述，不替换实际 Dep、wrapper 或对象引用。

生产态不初始化 WeakMap，不写入身份元数据。所有事件对象创建和调试回调赋值都放在开发态条件中。使用字面量 `process.env.NODE_ENV` 条件，使 Webpack 可以在生产构建中静态消除分支；实际生产压缩产物已验证事件构造路径和 debug 模块被移除。无监听器的高频 getter 不构造 DebuggerEvent。

### 4.2 Dep 与 ReactiveEffect

`Dep.depend(info?)`、`Dep.notify(info?)` 增加可选事件信息参数；原有无参数调用继续可用。

`ReactiveEffect.addDep(dep)` 在 `shouldTrack` 禁用时返回 `false`，接受依赖时返回 `true`，包括已经去重的重复读取。返回值只供 `Dep.depend()` 判断本次能否发出 `onTrack`，原依赖列表和去重过程不变。增加内部 `isTracking()` 查询，供没有独立 Dep 的 computed 读取点判断是否允许发出 track 事件。

开发态在 ReactiveEffect 上保存可选 `onTrack/onTrigger`。新增内部调试调用方法，只有存在回调时才创建完整事件：

```js
// 实现示意；省略开发态门禁和回调判定。
const event = Object.assign({ effect: this }, info)
pauseTracking()
try {
  callWithErrorHandling(callback, null, 'reactivity debugger hook', [event])
} finally {
  resetTracking()
}
```

暂停的是调试回调的依赖收集，不能暂停原通知或修改 Effect 的 active/paused 状态。异常复用现有 `callWithErrorHandling` 上报，tracking 状态始终在 finally 恢复。调试回调应只筛选、查看事件和执行 `debugger`，不修改响应式数据。

`Dep.notify` 使用原订阅者快照、原循环与原 `update()`。不在本方案中调整 scheduler 或补上额外 active 判断。

### 4.3 属性 数组与 ref

`defineReactive` 在原 getter 的 `dep.depend` 位置增加 get 描述，在原 setter 的 `dep.notify` 位置增加 set 描述。setter 的 old/new 值使用现有局部变量，不增加深拷贝，也不额外读取响应式属性。

`set/del` 与数组拦截方法分别在原通知点补上描述。数组 `key` 为调用的方法名，不为无法拦截的索引读写生成事件，也不试图构造完整旧数组。

`ref/shallowRef` 保留 `reactive({ [RefKey]: raw })` 或 shallow wrapper 的实现，在返回公开 ref 前注册调试身份。发布的事件使用公开 ref 和 `value`。customRef 的私有 version 事件使用同一注册机制归一化，省略版本值信息。

`toRef(obj, key)` 和 `toRefs(obj)` 保留转发语义，不给所有属性转发器另建 target：普通源属性的事件仍反映源对象和 key；如果读取过程中还访问了已有 ref，则该 ref 有自己的 value 事件。读取 `ref.value.name` 时，name 的事件仍属于内部对象。

### 4.4 computed 与 watch

computed 在创建内部 Effect 后、首次计算前接上第二参数中的调试回调。读取 computed.value 的 getter 中，在 dirty 计算完成并恢复外层 Dep.target 后，对外层 Effect 发出 `{ target: computedRef, type: 'get', key: 'value' }`，随后继续原 `effect.depend()`。

底层依赖转交仍使用无 info 的 `dep.depend()`。例如组件只读取 `doubled.value`：

```text
组件 onRenderTracked：target = doubled，key = value
computed onTrack：target = count，key = value
count 变化后的 computed onTrigger：target = count，key = value
count 变化后的组件 onRenderTriggered：target = count，key = value
```

最后一行由底层依赖转交产生，与 Vue 2.7 的结构一致；不人为制造 `target = doubled` 的 trigger 事件，不增加 computed 自己的 Dep。

watch 在 `new ReactiveEffect(getter, scheduler)` 后、immediate 或首次 `effect.run()` 前赋值调试回调。watchEffect、watchSyncEffect、watchPostEffect 已转发到 watch，可复用同一接入点。watch 的新旧值比较、deep 遍历、flush 选项和停止函数保持原行为。

## 5 组件 Hook 与双端接线

### 5.1 注册与调用

在 `core/innerLifecycle.js` 增加内部 `RENDERTRACKED/RENDERTRIGGERED` 标识，并沿用私有 Hook 名称 `__renderTracked__/__renderTriggered__`。无需把这两个标识作为新的公开常量导出。

在 `core/proxy.js` 提供 `onRenderTracked/onRenderTriggered` 注册函数，注册位置与现有组合式 Hook 一致，使用 `instance.hooks` 保存回调。只在开发态注册；生产态函数为 noop。

调试 Hook 使用专用分发函数，复用已有 hooks 列表及错误处理，不直接复用会切换并清空 currentInstance 的普通生命周期调用路径。同步通知可能发生在另一个组件 setup 中，需要在调试回调期间切换到所属实例，并在 finally 恢复先前 currentInstance。scope 通过已有 `instance.scope.run()` 临时进入并恢复，避免破坏嵌套 scope。依赖收集隔离由 Effect 的调试调用方法统一负责。

新增内部 `bindRenderDebugHooks(effect, proxy)`，按已注册的 Hook 为渲染 Effect 设置 onTrack/onTrigger。仅在开发态且存在对应监听器时绑定；注册要求同步在 setup 完成，因此无需运行时监听器刷新机制。

### 5.2 小程序

在 `MpxProxy.initRender()` 创建渲染 Effect 之后、第一次 `update()` 之前调用绑定函数。这样首次渲染就有 onRenderTracked，后续 setter 通知可在入队前同步触发 onRenderTriggered。

原有 `__injectedRender -> renderWithData -> diff -> setData` 保持原状。本次 Hook 不等待 setData 回调，也不把 `onRenderTriggered` 定义成视图更新完成。

### 5.3 Mpx2RN

在 `getDefaultOptions.ios.js` 的 `createEffect()` 中创建 `proxy.effect` 后调用同一绑定函数，适用于该分支承载的 ios/android/harmony 输出。

```text
onRenderTriggered
  -> 原 scheduler queueJob(update)
  -> update 通知 useSyncExternalStore
  -> React 渲染中的 proxy.effect.run()
  -> onRenderTracked
```

RN 的队列 job 只通知 React，实际渲染 Effect 在 React 渲染阶段执行。父组件、React Hooks 或其他 React 输入导致的渲染，可能没有响应式 onRenderTriggered。React 开发态重复渲染可能带来重复 onRenderTracked；这两类 Hook 均不用于统计提交次数或屏幕帧数。本方案不新增 React Hook，不改变已有 React Hook 调用顺序。

### 5.4 导出路径

公共 `platform/export/index.js` 从 core/proxy 导出两个新 Hook，根 `src/index.js` 现有 star export 随之生效。Web 专用 `platform/export/index.web.js` 从 Vue 2.7 重导出同名原生 Hook，避免公共导出产生跨平台导入缺口。Web 只做导出兼容与 smoke 检查，不修改其观察层。

## 6 RD 结合 sourcemap 使用

### 6.1 调试前提

业务使用包含本能力的开发构建。最终运行 bundle 与 sourcemap 必须来自同一平台、同一次构建，开发者工具开启源码映射，且能把 script 区块中的方法定位到原始 `.mpx/.ts`。

已有业务 sourcemap 足以优先定位业务赋值行。需要单步进入 Mpx 的 Dep/Effect 源码时，最终 sourcemap 还需保留 `@mpxjs/core` 的映射；检查 node_modules 是否被调试器忽略。框架不自动解析或上传 map。

Webpack 配置片段如下，合并进业务现有构建配置，不替换其他配置：

```js
{
  mode: 'development',
  devtool: 'source-map'
}
```

该配置不保证所有上游 loader 自动提供正确映射。先在业务 `increase()` 的赋值行验证实际断点位置，再进入 Hook。RN 使用运行环境支持的 JavaScript 调试器；若使用 Hermes 字节码产物，需要与该产物对应的最终映射，不能直接套用另一份 Webpack JS map。

### 6.2 双端组件示例

下列示例使用本次新增接口。先在测试组件中只启用组件 Hook，避免同一次赋值连续命中多个 debug 断点。

```html
<template>
  <view bindtap="increase">
    <text>点击加一：{{ count }}，两倍：{{ doubled }}</text>
  </view>
</template>

<script>
import {
  createComponent,
  ref,
  computed,
  onRenderTracked,
  onRenderTriggered
} from '@mpxjs/core'

createComponent({
  setup () {
    const count = ref(0)
    const doubled = computed(() => count.value * 2)

    if (process.env.NODE_ENV !== 'production') {
      onRenderTracked((event) => {
        if (event.target === count || event.target === doubled) {
          console.log('render tracked', event.type, event.key)
        }
      })

      onRenderTriggered((event) => {
        if (event.target === count && event.key === 'value') {
          debugger
        }
      })
    }

    return {
      count,
      doubled,
      increase () {
        count.value++
      }
    }
  }
})
</script>
```

进入页面时先观察 track 输出；点击后在 trigger Hook 暂停。调用栈中会有业务 increase、ref setter、reactive setter、Dep.notify 与调试分发帧，具体帧数随平台和构建变化。选择映射后的 increase 业务帧，检查赋值行及当时上下文。继续执行后，组件重新收集依赖。

在 Hook 里暂停时，原赋值通知尚在执行，组件渲染和宿主提交可能尚未发生。因此查看 event.oldValue/newValue，不用此时的画面判断更新是否已经完成。框架内部帧可在第一次排查时单步查看，RD 日常排查通常选择第一处业务源码帧即可。

### 6.3 computed 与 watch 示例

排查 computed 时将上例的 computed 定义替换为：

```js
const doubled = computed(
  () => count.value * 2,
  process.env.NODE_ENV !== 'production'
    ? {
        onTrack (event) {
          console.log('computed tracked', event.type, event.key)
        },
        onTrigger (event) {
          if (event.target === count) debugger
        }
      }
    : undefined
)
```

computed.onTrigger 暂停在底层 count 的通知阶段，位于该 computed 的原 update/scheduler 之前。此时不能假设 dirty 已经更新，缓存结果也可能仍是旧值；不能把该事件解释成 doubled 的结果已经发生变化。

排查 watcher 时增加：

```js
watch(count, (value, oldValue) => {
  console.log('watch callback', oldValue, value)
}, {
  onTrack (event) {
    console.log('watch tracked', event.type, event.key)
  },
  onTrigger (event) {
    if (event.target === count) debugger
  }
})
```

watch 的调试选项在生产态被框架忽略。业务临时的 debug 代码可再用开发态条件包裹；框架不负责删除业务主动写入的普通日志或任意位置的 debugger。onTrigger 同步暂停，但 watch callback 仍按 flush 配置执行。

### 6.4 事件没有出现时

| 现象 | RD 检查顺序 |
| --- | --- |
| 没有 render track | 是否开发构建；Hook 是否在 setup 同步注册；是否走 Mpx 渲染 Effect；该状态是否实际被本次渲染读取 |
| 值变了却没有 trigger | 是否同值赋值；是否已 stop/unmount；是否直接新增属性或数组索引赋值；筛选的 target 是否对应真实源对象或 ref |
| computed 读取是 doubled，trigger 是 count | Vue 2.7 式底层依赖转交的正常表现 |
| 多个 trigger 对应一次更新 | 原调度器对任务去重；事件次数不等于渲染次数 |
| RN 有 track 而没有 trigger | 检查父组件、React Hooks 和其他 React 输入；这次渲染可能不是 Mpx 响应式通知引起 |
| Hook 能暂停，但业务源码行不对 | 检查平台、bundle/map 版本、script loader 映射链与调试器配置 |

## 7 文件改动清单

| 文件 | 改动 |
| --- | --- |
| `packages/core/src/observer/debug.js` | 新增开发态 ref 身份元数据与操作类型 |
| `packages/core/src/observer/dep.js` | 可选 info 参数、同步分发 Hook |
| `packages/core/src/observer/effect.js` | 回调字段、addDep 返回值、isTracking、调试调用隔离 |
| `packages/core/src/observer/reactive.js` | get/set/add/delete 事件描述 |
| `packages/core/src/observer/array.js` | array mutation 描述 |
| `packages/core/src/observer/ref.js` | 普通 ref/shallowRef/customRef 归一化 |
| `packages/core/src/observer/computed.js` | 第二参数、computed 读取描述 |
| `packages/core/src/observer/watch.js` | 接入 debugOptions |
| `packages/core/src/core/innerLifecycle.js` | 内部 Hook 标识 |
| `packages/core/src/core/proxy.js` | 注册、分发、绑定，小程序接线 |
| `packages/core/src/platform/patch/getDefaultOptions.ios.js` | RN Effect 接线 |
| `packages/core/src/platform/export/index.js`、`index.web.js` | 公共与 Web 导出 |
| `packages/core/@types/index.d.ts` | 事件、选项、Hook、computed 重载 |

实施中保留 runtime 禁止对象 spread 的约束，合并事件用 `Object.assign`。不修改 perf 或 scheduler，不新增业务侧依赖包。

## 8 验证与验收

核心 Jest 仅覆盖契约和实际剩余风险：

1. 同步 get/set 事件：target/key/type/oldValue/newValue 正确，trigger 在原 scheduler 前；同值赋值无新增通知。
2. ref/shallowRef/customRef/toRef：公开身份正确，customRef 不泄露 version 值，属性转发器保留源属性语义。
3. 新增、删除、数组变更：事件描述正确，通知次数与当前行为一致，不为未拦截操作制造事件。
4. computed：debugOptions 在首次计算前有效；computed track 与底层 trigger 分别正确；保留缓存与依赖转交。
5. watch 系列：首次 track、同步 trigger 和各 flush 配置正确；停止后不再触发；原 callback 比较逻辑不变。
6. 隔离与清理：调试回调读取另一属性不订阅到原 Effect；回调抛异常后 tracking 恢复；分支切换清理旧依赖；组件 Hook 恢复原 currentInstance 与 scope。
7. 两端组件接线：首次渲染已有 track；小程序通知发生在入队前；RN 同样可通知并在 React 渲染时 track；unmount 后正常取消订阅。
8. 生产模式：用隔离模块加载切换 NODE_ENV 后再导入，验证不注册、不分发；同时检查真实压缩产物没有 debug WeakMap 初始化或事件对象创建路径。

测试文件建议新增在 `packages/core/__tests__/common/`：`reactivity-debug.spec.js`、`render-debug.spec.js`、`reactivity-debug-production.spec.js`，另在 `rn/reactivity-debug.spec.js` 与 `web/reactivity-debug.spec.js` 验证平台接线。用现有 Jest/Babel 配置，平台全局和模块缓存按现有测试方式隔离。RN 测试除 Effect 接线外，还应覆盖 React 触发的重新渲染；不能只 mock queueJob 后就认定完整链路通过。

完成实现后执行变更文件 ESLint 和相关 Jest。单元测试失败最多修复 3 次，仍失败按仓库约束停止并报告错误。文档方案本身不等同于上述用例已经通过。

业务验证使用同一示例编译 wx 与 ios（业务需要时补 android/harmony），进入页面点击一次，确认：事件 target 是公开 ref；Hook 保留业务同步赋值栈；调试器能定位原始脚本行；小程序显示数值更新，RN 显示同样更新。验证模板源码行列不属于首版验收项。

## 9 文档与 Skill 同步

实施时在同一次改动中完成：

- `docs-vitepress/api/reactivity-api.md`：增加 DebuggerEvent 说明、watch/computed 调试选项和事件语义。
- `docs-vitepress/api/composition-api.md`：增加两个组件 Hook、同步注册要求及开发态限制。
- 现有组合式 API 指南的对应位置：加入双端 RD 示例和 sourcemap 检查步骤。若新增独立指南，则同步侧边栏和目录索引；优先复用现有指南。
- `.agents/skills/mpx2rn/references/rn-script-reference.md`：同步新命名导出与调试用法，明确 trigger 与 React render/commit 的区别。
- 新增或修改中文文档标题按 `docs-vitepress/AGENTS.md` 添加英文哈希锚点。

交付顺序为观察层事件与 debugOptions、双端组件 Hook 接线、类型文档与业务示例验证。首版以 RD 能通过同步 Hook 断点回到正确业务赋值行为验收，后续是否增加录制与完整链路可基于实际使用反馈决定。


## 10 本次实现验证

- `feat-reactivity-debug-hooks` 分支完成观察层事件、双端组件 Hook 和开发态接口。
- core 的 13 个 Jest 测试套件、93 项测试通过，包含新增的事件、隔离、生产态、小程序注入渲染与 React 实际渲染测试。
- 变更运行时、测试、类型声明及示例脚本的 ESLint 通过，公共 API 示例的 TypeScript 类型检查通过。
- 隔离 Webpack 生产构建中，响应式更新正常，调试事件数量为零；事件构造字符串和 debug 模块不在压缩后的有效产物中。
- 开发构建的同步 onTrigger 写入栈经 sourcemap 映射回原始业务赋值行。
- `.mpx` 示例通过 wx 与 ios 的隔离 CLI 编译，无错误和警告。验证工程使用当前 core 源码别名、已有 CLI 依赖、RN JSX 转换以及未参与示例行为的 wifi 原生模块 external 配置。
- 已检查官方文档链接、英文锚点、示例一致性及 RN Skill 导出表格。实际小程序开发者工具和 RN 实机中的断点操作仍需业务接入时按指南执行。
