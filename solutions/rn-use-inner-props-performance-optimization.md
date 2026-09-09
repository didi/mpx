# RN useInnerProps 耗时优化方案

## 背景

`packages/webpack-plugin/lib/runtime/components/react/getInnerListeners.ts` 中的 `useInnerProps` 是 RN 内建组件的通用 props 适配入口，当前被 `mpx-view`、`mpx-button`、`mpx-image`、`mpx-scroll-view` 等大量组件调用。该 hook 每次 render 都会完成三类工作：

1. 从 Mpx 事件属性（如 `bindtap`、`catchtouchmove`、`capture-bindtap`）生成 RN touch 事件处理器。
2. 从传入 props 中移除 RN 不应透传的内部属性和原始 Mpx 事件属性。
3. 注入 `layoutRef`、`propsRef`、`innerRef`、`disableTap`、`navigation` 等运行时事件上下文。

由于该路径覆盖面很广，尤其在 view-heavy 页面或滚动列表中，render 阶段的无效遍历和对象分配会被放大。

## 现状问题

### 1. 同一份 props 被重复枚举

当前流程：

1. `Object.keys(props).forEach` 遍历一次 props，识别事件属性并生成 `rawEventKeys`。
2. 构造 `removeProps` 数组。
3. `omit(props, removeProps)` 内部先 `Object.assign({}, props)` 再逐项 `delete`。

这意味着每次 render 至少有：

1. 一次完整 props key 遍历。
2. 一次 `Object.assign` 枚举拷贝。
3. 一次 removeProps 删除循环。

其中 `rawEventKeys` 只服务于后续 `omit`，属于由两阶段流程带来的中间数据。

### 2. 每个事件属性每次 render 都做正则解析

事件 key 已经收敛在 `event.config.ts` 的固定表中，但 `useInnerProps` 每次遇到事件属性都会执行：

```ts
/^(bind|catch|capture-bind|capture-catch)(.*)$/.exec(key)
```

事件前缀、事件名、冒泡/捕获类型、是否 catch 都可以在模块初始化时从 `eventConfigMap` 预计算出来，没有必要在热路径中重复解析。

### 3. `events` memo 可能持有旧的 rawConfig

`events` 当前只依赖 `hashEventKey`：

```ts
const events = useMemo(() => {
  // ...
}, [hashEventKey])
```

但 handler 闭包捕获的是当次 render 的 `eventConfig`。当事件 key 集合不变、`rawConfig` 变化时，handler 不会重建，闭包中的 `disableTap`、`layoutRef`、`navigation` 仍可能是旧值。

典型风险是 `mpx-button` 传入：

```ts
{
  layoutRef,
  disableTap: disabled
}
```

如果 `disabled` 动态变化但事件 key 集合未变，`handleTouchend` 读取的 `disableTap` 存在陈旧风险。优化方案需要顺手修正这个闭包新鲜度问题，否则性能优化会掩盖既有语义隐患。

### 4. 每次 touch 事件触发时都会创建 handler map

`createTouchEventHandler` 返回的函数内部每次被 RN 触发都会创建：

1. `bubbleHandlerMap`
2. `captureHandlerMap`

这部分虽然不属于 render 阶段，但 `touchmove` 频繁触发时会产生额外对象分配和属性查找成本。映射关系是静态的，适合提升到模块级常量。

## 优化目标

1. `useInnerProps` 每次 render 只遍历一次 props。
2. 移除 render 阶段事件 key 正则解析。
3. 移除 `rawEventKeys`、`transformedEventSet` 等仅因两阶段流程产生的中间数据。
4. 保持 `events` 在事件 key 集合不变时的引用稳定。
5. 保证事件处理时读取最新 `rawConfig` 和最新 props。
6. 不改变现有 props 合并优先级：`extendObject({}, events, restProps)`，即透传的同名 props 仍覆盖生成事件。
7. 运行时代码继续使用 `extendObject` / `Object.assign`，不使用 object spread。

## 技术方案

### 1. 直接维护事件元信息配置

`event.config.ts` 仅被 `getInnerListeners.ts` 消费，直接把配置维护为运行时需要的元信息格式，避免额外的模块初始化推导：

```ts
const eventConfigMap: Record<string, EventMeta> = {
  bindtap: {
    bitFlag: '0',
    events: ['onTouchStart', 'onTouchMove', 'onTouchEnd'],
    eventName: 'tap',
    eventType: 'bubble',
    hasCatch: false
  },
  catchtouchmove: {
    bitFlag: '9',
    events: ['onTouchMove'],
    eventName: 'touchmove',
    eventType: 'bubble',
    hasCatch: true
  }
}
```

这样事件 key 不再需要在运行时解析。`EventMeta` 可包含：

1. `bitFlag`
2. `events`
3. `eventName`
4. `eventType`
5. `hasCatch`

### 2. 模块级预计算基础移除属性

把固定移除属性提升为常量 map：

```ts
const baseRemovePropsMap = {
  children: true,
  'enable-background': true,
  'enable-offset': true,
  'enable-var': true,
  'external-var-context': true,
  'parent-font-size': true,
  'parent-width': true,
  'parent-height': true
}
```

`userRemoveProps` 通常由调用组件传入数组字面量，引用不稳定，不建议依赖 `useMemo` 按数组引用缓存。更稳妥的方式是在当前 render 中把它转换为一个小 map，成本与当前 `delete` 循环同阶，但可以配合单次 props 遍历省掉后续 `omit`。

### 3. 单次 props 遍历同时完成事件解析与 restProps 构造

核心流程改为：

1. 先创建本次 render 的 `eventConfig`。
2. 创建 `userRemovePropsMap`。
3. 遍历 `Object.keys(props)` 一次。
4. 如果 key 命中 `eventConfigMap`：更新 `hashEventKey`、事件名集合和 `eventConfig`，不写入 `restProps`。
5. 如果 key 命中基础移除属性或用户移除属性：跳过。
6. 其他 key 写入 `restProps`。

伪代码：

```ts
const restProps: Props = {}
const eventNameMap: Record<string, true> = {}
let hashEventKey = ''

Object.keys(props).forEach((key) => {
  const eventMeta = eventConfigMap[key]

  if (eventMeta) {
    hashEventKey += eventMeta.bitFlag
    eventMeta.events.forEach((event) => {
      eventNameMap[event] = true
    })

    eventConfig[eventMeta.eventName] = eventConfig[eventMeta.eventName] || {
      bubble: [],
      capture: [],
      hasCatch: false
    }
    eventConfig[eventMeta.eventName][eventMeta.eventType].push(key)

    if (eventMeta.hasCatch) {
      eventConfig[eventMeta.eventName].hasCatch = true
    }
    return
  }

  if (!baseRemovePropsMap[key] && !userRemovePropsMap[key]) {
    restProps[key] = props[key]
  }
})
```

这样可以删除 `rawEventKeys`、`transformedEventSet` 和 `omit(props, removeProps)`，避免重复枚举和 delete。

### 4. 使用 ref 保证事件上下文新鲜

新增 `eventConfigRef`：

```ts
const eventConfigRef = useRef<EventConfig>()
eventConfigRef.current = eventConfig
```

`events` 仍然只按 `hashEventKey` 变化重建，但 handler 不再闭包捕获某次 render 的 `eventConfig`，而是在 RN 事件触发时读取 `eventConfigRef.current`：

```ts
events[eventName] = createTouchEventHandler(eventName, eventConfigRef)
```

这样可以同时满足：

1. 非事件 props 或 `rawConfig` 变化时，`events` 引用稳定。
2. 事件触发时读取最新 `propsRef.current` 和最新 `rawConfig`。
3. `disableTap` 动态变化时不再依赖事件 key 变化来刷新闭包。

`handleTouchstart` 内部的 longpress 定时器可以继续捕获本次 touchstart 进入时的 eventConfig 快照，避免一个长按手势中途因为配置切换造成事件链不一致。

### 5. 提升 touch handler map 到模块级

把 `bubbleHandlerMap` / `captureHandlerMap` 改为模块级常量，或合并为一个 `touchHandlerMap`：

```ts
const touchHandlerMap = {
  onTouchStart: { type: 'bubble', handler: handleTouchstart },
  onTouchMove: { type: 'bubble', handler: handleTouchmove },
  onTouchEnd: { type: 'bubble', handler: handleTouchend },
  onTouchCancel: { type: 'bubble', handler: handleTouchcancel },
  onTouchStartCapture: { type: 'capture', handler: handleTouchstart },
  onTouchMoveCapture: { type: 'capture', handler: handleTouchmove },
  onTouchEndCapture: { type: 'capture', handler: handleTouchend },
  onTouchCancelCapture: { type: 'capture', handler: handleTouchcancel }
}
```

`createTouchEventHandler` 中只做一次静态查表：

```ts
function createTouchEventHandler (eventName: string, eventConfigRef: EventConfigRef) {
  const eventHandler = touchHandlerMap[eventName]
  return (e: ExtendedNativeTouchEvent) => {
    eventHandler.handler(e, eventHandler.type, eventConfigRef.current!)
  }
}
```

这可以消除每次 touch 事件触发时的临时 map 分配。

## 建议落地步骤

1. 将 `event.config.ts` 调整为 `EventMeta` 配置格式，新增 `EventConfigRef` 类型，补充 `baseRemovePropsMap`、`touchHandlerMap` 模块级常量。
2. 改造 `createTouchEventHandler`，参数从 `eventConfig` 改为 `eventConfigRef`。
3. 改造 `useInnerProps` 的 render 阶段逻辑，单次遍历 props 生成 `restProps`、`hashEventKey`、`eventNameMap`、`eventConfig`。
4. 用 `eventConfigRef.current = eventConfig` 保证 handler 读取最新配置。
5. 返回值保持 `extendObject({}, events, restProps)`，避免改变同名 props 覆盖关系。
6. 删除不再需要的 `omit` import。

## 验证方案

建议覆盖以下核心场景，无需全量测试：

1. 无事件 props：内部属性和 `userRemoveProps` 被移除，普通 props 透传。
2. `bindtap`：生成 `onTouchStart`、`onTouchMove`、`onTouchEnd`，并在 bubble 队列记录原始事件 key。
3. `catchtouchmove`：生成 `onTouchMove`，`touchmove.hasCatch` 为 true，并调用 `stopPropagation`。
4. `capture-bindtap` / `capture-catchtap`：进入 capture 队列，生成 capture 侧 RN 事件名。
5. 非事件 props 更新：`events` 引用保持稳定，`restProps` 更新。
6. 事件回调函数更新：不重建 `events`，但触发时通过 `propsRef.current` 调用最新函数。
7. `mpx-button disabled` 动态切换：事件 key 集合不变时，`disableTap` 仍读取最新值。
8. touchmove 高频触发：确认 `createTouchEventHandler` 不再在每次事件中创建临时 map。

如果补充基准，可以用合成 props 对比当前“两次枚举 + delete”与“单次枚举 + 跳过写入”。本地 Node 合成场景中，50 个左右 props、3 个事件 props、8 个 userRemoveProps，50 万次循环从约 `3575ms` 降到约 `1190ms`。该数字只说明方向，最终收益应以 RN 目标运行时和真实页面 profiling 为准。

## 风险与注意事项

1. 不建议把 `userRemoveProps` 直接放进 `useMemo` 依赖，因为调用方大量使用数组字面量，引用稳定性不足。
2. 不建议改成排序后的事件 hash；保持当前 `Object.keys(props)` 顺序生成 hash，可以减少不必要的行为差异。
3. 单次遍历构造 `restProps` 时必须保留 `extendObject({}, events, restProps)` 的合并顺序。
4. `eventConfigRef` 修复 rawConfig 陈旧问题时，需要确认 longpress 定时器使用的是 touchstart 进入时的事件配置快照，避免一个手势周期内配置漂移。
5. 该改造属于 RN runtime 内部性能优化，不改变用户开发使用方式，正常无需同步文档或 Mpx2RN skill。
