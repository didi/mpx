# 响应式调试 {#reactivity-debugging}

遇到组件意外更新、计算属性未按预期失效或 watcher 的依赖不明确时，可以使用开发态调试 Hook 查看依赖来源，并在变化通知发生时用 `debugger` 暂停，结合 sourcemap 找到业务赋值行。

本页示例同时适用于小程序和 Mpx2RN。Web 输出使用 Vue 2.7 的原生调试接口。所有调试 Hook 和 `onTrack/onTrigger` 仅在开发环境生效，生产环境保持原响应式与调度行为。

调试选项也支持选项式用法：页面和组件的 [`watch`](../../api/optional-api.md#watch-debug-options) 可在 `handler` 对象中配置 `onTrack/onTrigger`，[`this.$watch`](../../api/instance-api.md#watch) 可通过第三参数或第二参数的 `handler` 对象传入。选项式 `computed` 没有独立的调试配置入口，需要使用组合式 `computed` 的第二参数。

组件级渲染调试同样支持选项式 [`renderTracked` / `renderTriggered`](../../api/optional-api.md#render-debug-hooks)，可直接声明在页面或组件选项中，无需 `setup`；支持 Mixin 合并，钩子中的 `this` 指向当前实例。

## 观察读取与通知 {#track-and-trigger}

- `onRenderTracked` 回答“本次组件渲染读取了哪个响应式依赖”。
- `onRenderTriggered` 回答“哪个依赖的变化通知了当前组件的渲染 Effect”。
- `computed` 的第二参数以及 watch 系列的 options 中，可以使用 `onTrack/onTrigger` 单独观察对应的计算或侦听。

trigger 回调同步执行，位于原 update/scheduler 之前。这时业务赋值的调用栈通常仍在，适合定位写入位置。后续任务仍按原 scheduler 执行，多个 trigger 可以合并到一次渲染。Hook 不等待 setData 回调或 React 提交。

## 在业务组件中设置断点 {#component-example}

将下面的组件放进目标页面，并使用开发构建运行。组合式组件 Hook 必须在 setup 同步注册；使用 `<script setup>` 时也须在顶层同步调用，并按平台要求暴露模板使用的状态。

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
          // eslint-disable-next-line no-debugger
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

<script type="application/json">
{
  "component": true
}
</script>
```

进入页面后，控制台会输出组件读取的依赖。点击时在 onRenderTriggered 中暂停，检查 `event.target === count`、`event.type === 'set'`、`event.key === 'value'` 以及 oldValue/newValue。在调用栈中选择 `increase()` 所在的业务帧，即可查看原始赋值行和局部变量；继续执行后组件按原调度规则更新。

Mpx 普通 ref 的调试 target 是业务持有的 ref，所以可以直接按身份筛选。`toRef(state, 'count')` 转发到源属性时，target/key 则通常是 state/count；不要把所有事件都按 ref 身份过滤。

> 调试回调应只筛选、查看和暂停。小程序和 Mpx2RN 会隔离调试回调的依赖收集，普通响应式读取不会成为当前 Effect 的额外依赖。Web 的 watch/computed 使用 Vue 2.7 原生实现，不提供同样的读取隔离；尤其不要在 onTrack 中读取 ref.value 或其他响应式属性，否则可能递归触发 onTrack。动态过滤条件和断点开关应使用普通变量或普通对象，像上例一样检查 event 字段和对象身份即可。各平台均应避免在回调中写状态、运行副作用或调用有副作用的 getter。

## 使用 sourcemap 找到业务源码 {#source-map}

先在业务赋值行设置普通断点，确认开发者工具已经能定位原始 `.mpx/.ts`，再进入响应式 Hook。Webpack 配置可以开启完整 source map，合并到项目现有配置中：

```js
{
  mode: 'development',
  devtool: 'source-map'
}
```

排查步骤如下：

1. 使用同一次构建生成的 bundle 和 map，并确认它们对应当前运行平台。
2. 在小程序开发者工具或 RN JavaScript 调试器中启用源码映射，加载包含 Hook 的组件。
3. 复现一次操作，在同步 onRenderTriggered 断点处暂停。
4. 调用栈会包含业务方法、ref/属性 setter、Dep.notify 和调试分发代码；选择映射后的第一个相关业务帧。
5. 检查写入的来源与当时上下文，然后继续执行观察实际更新。

只定位业务赋值时，先验证业务 script 的映射即可。需要单步进入 Mpx 的 Dep/Effect 时，最终 map 还应保留 `@mpxjs/core` 源码位置，并检查调试器是否忽略了 node_modules。

RN 使用 Hermes 字节码产物时，需要对应产物的最终映射；不能使用另一平台或另一份未组合的 JS map。Mpx 调试 Hook 不自动解析、生成或上传 sourcemap。

模板生成的 render 代码也需要自己的映射。业务 script 的 map 可用，不代表模板表达式已有精确行列；本页的优先定位目标是产生状态写入的业务脚本。

## 单独排查 computed {#computed-debugging}

```js
import { ref, computed } from '@mpxjs/core'

const count = ref(0)
const doubled = computed(() => count.value * 2, {
  onTrack(event) {
    console.log('computed tracked', event.type, event.key)
  },
  onTrigger(event) {
    if (event.target === count) debugger
  }
})

console.log(doubled.value) // 首次读取收集 count.value
count.value++ // 同步通知，随后按原逻辑标记 dirty
```

computed 读取时仍使用原缓存规则。onTrigger 在原 scheduler 标记 dirty 之前调用，不能假设 dirty 已更新，更不能据此认定 computed 的结果已经变化。

Mpx 的依赖转交沿用 Vue 2.7 式语义。如果组件只读取 doubled.value，可以看到这样的事件：

| 接口 | target / key |
| --- | --- |
| 组件 onRenderTracked | doubled / value |
| computed onTrack | count / value |
| count 改变时的 computed onTrigger | count / value |
| count 改变时的组件 onRenderTriggered | count / value |

组件 trigger 的来源是底层 count。这种情况无需在 doubled 上新增赋值。

## 单独排查 watch {#watch-debugging}

```js
import { ref, watch } from '@mpxjs/core'

const count = ref(0)
const stop = watch(count, (value, oldValue) => {
  console.log('watch callback', oldValue, value)
}, {
  onTrack(event) {
    console.log('watch tracked', event.type, event.key)
  },
  onTrigger(event) {
    if (event.target === count) debugger
  }
})

count.value++ // 先同步 onTrigger，watch callback 仍按 flush 配置执行
stop()
```

watchEffect、watchSyncEffect、watchPostEffect 同样支持这两个 options。onTrack 对应 watcher getter 的依赖收集，onTrigger 对应依赖通知；重新运行后的 getter 值没有变化时，watch callback 仍可能被跳过。停止 watcher 后正常取消订阅，调试事件也停止。

在小程序和 Mpx2RN 中，flush 配置控制 Mpx 的 JS 调度队列。后置回调不能单独作为原生视图或 React 提交完成的保证；需要判断视图完成时，使用平台对应的完成回调或生命周期。

## 看懂数组事件与更新次数 {#event-boundaries}

```js
import { reactive, watch } from '@mpxjs/core'

const state = reactive({ items: [] })
watch(() => state.items, () => {}, {
  onTrigger(event) {
    console.log(event.type, event.key)
  }
})

state.items.push('first') // array mutation / push
state.items.splice(0, 1, 'second') // array mutation / splice
```

数组事件以数组自身为 target、方法名为 key，不创建数组快照。直接新增对象属性和直接数组索引赋值仍遵循 Mpx 的既有响应式限制；应按实际需求使用 set、del、splice 等已有 API。

相同属性被重复读取时可能多次 track，但订阅依然去重。一次赋值可能通知多个 Effect，连续赋值可能合并为一次组件更新，所以调试事件次数不等于渲染次数。

Mpx2RN 的组件还可以由父组件、React Hooks 或其他 React 输入驱动渲染，这些路径可能只有 track，没有 Mpx 响应式 trigger。React 开发态重复执行渲染，也不等于重复提交了屏幕画面。

## 常见排查结果 {#troubleshooting}

| 现象 | 检查方向 |
| --- | --- |
| 没有 render track | 开发环境、setup 同步注册、当前渲染是否实际读取状态，以及是否创建 Mpx 渲染 Effect |
| 值变了却没有 trigger | 同值赋值、stop/unmount、未被观察的新增属性或数组索引、过滤的 target 是否正确 |
| computed track 是 doubled，trigger 是 count | Vue 2.7 式底层依赖转交的正常现象 |
| Hook 能停，但业务源码行不对 | bundle/map 是否匹配、script loader 映射链、调试器的 source map 与忽略列表设置 |
| 打印的旧对象后来也变了 | oldValue/newValue 是对象引用，控制台稍后展开时可能展示后续状态 |
| RN 有 track 没有 trigger | 检查父级、React Hooks 等 React 输入 |

生产环境忽略框架调试接口；业务主动写入的普通日志或其他位置的 debugger 不会由框架自动删除。建议像完整示例一样用开发态条件包裹临时调试代码。
