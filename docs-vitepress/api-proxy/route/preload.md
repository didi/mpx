# mpx.preload({ url })

在当前页面仍显示时，提前创建和渲染目标页面。仅支持 React Navigation 7.x 官方 Native Stack，Screen 不配置 `getId`；DRN 自研导航器、Web 和小程序暂不支持。

## 用法 {#usage}

```js
// 已通过 mpx.use(apiProxy) 安装 @mpxjs/api-proxy。
mpx.preload({ url: '/pages/detail?id=1' })
// 需要进入时，仍调用现有导航 API。
mpx.navigateTo({ url: '/pages/detail?id=1' })
```

`url` 为必填字符串，支持 query 和相对于当前聚焦页面的路径。返回 `undefined`，无 `success/fail/complete`，不保证实例或数据已就绪。开启 `usePromise` 时默认不包装 Promise，不要将其加入 `whiteList`。预加载不占用导航锁，可立即调用 `navigateTo`。

## 注意事项 {#notes}

- 预加载会提前执行创建钩子与 `onLoad`，`onReady` 也可能提前；未展示时不触发 `onShow/onHide`。正式进入复用实例时触发 `onShow`，不重跑初始化。
- RN 页面实例提供只读 `wasPreloaded`：预加载阶段创建为 `true`，入栈后才创建为 `false`，创建钩子前可读且此后不变。它不代表当前是否显示或就绪，请勿定义同名字段。
- 同名重复 preload 会替换候选；`navigateTo` 可复用同名候选，以正式跳转参数为准。若预加载 `id=1`、跳转 `id=2`，`onLoad` 不会重跑，业务需自行处理参数变化。
- 复用实例时保留 EventChannel，正式跳转再添加 `events` 监听，不补发预加载期间的消息。
- 仅预加载也会触发 `rnConfig.onStateChange`，不代表真实跳转。显示相关副作用应放在 `onShow`，未使用的预加载实例也需在卸载时清理资源。
