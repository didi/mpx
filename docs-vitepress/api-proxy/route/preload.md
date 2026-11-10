# mpx.preload({ url })

预加载目标页面，提前完成页面创建和渲染，不发生页面跳转。仅支持 React Native 端，使用 React Navigation 7.x Native Stack。

## 用法 {#usage}

```js
// 预加载详情页
mpx.preload({ url: '/pages/detail?id=1' })

// 需要展示时再跳转
mpx.navigateTo({ url: '/pages/detail?id=1' })
```

`url`：必填，类型为 `string`，表示目标页面路径，支持相对路径和 query 参数。

无返回值，不提供完成回调或 Promise。调用结束不代表页面或数据已加载完成。

## 注意事项 {#notes}

- 预加载会提前执行 `onLoad`，但不触发 `onShow/onHide`。正式进入并复用该页面时触发 `onShow`，不重复执行 `onLoad`。
- 页面实例的只读属性 `wasPreloaded` 表示实例是否在预加载阶段创建，在创建钩子中即可读取，此后保持不变。
- 预加载与跳转参数不同时，可能仍复用同一实例，业务需自行处理参数变化。建议两次调用使用相同参数。
- 预加载阶段 `getOpenerEventChannel()` 返回 `undefined`，正式进入后可在 `onShow` 中获取通道并注册监听。重复显示时请避免重复注册；发送消息前需确认接收方已就绪。
