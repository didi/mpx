# mpx.preload({ url })

在当前页面仍显示时，提前创建和渲染目标页面。仅支持 React Navigation 7.x 官方 Native Stack，Screen 不配置 `getId`；DRN 自研导航器、Web 和小程序暂不支持。

## 参数与返回值 {#parameters}

| 参数 | 类型 | 必填 | 说明 |
| --- | --- | --- | --- |
| url | string | 是 | 已注册页面路径，可带 query；相对路径基于当前聚焦页面解析 |

返回 `undefined`。没有 `success/fail/complete`，内置于 promisify 黑名单，开启 `usePromise` 时默认不包装为 Promise。不要将其加入 `whiteList`，否则强制包装的 Promise 无法通过回调结束。返回不代表页面或数据已就绪。

`mpx.canIUse('preload')` 按 RN 静态支持表返回结果，不判断当前导航器是否就绪或兼容，也不对 preload 参数逐项校验。实际调用时检查导航器能力。不支持、URL 格式错误或已有真实导航进行中时报告框架诊断并返回。目标页面是否已注册由 React Navigation 处理，Mpx 不额外检查或保证提供未注册页面的诊断。预加载不占用导航锁，可以随后立即 `navigateTo`。

## 示例 {#example}

```js
// 已通过 mpx.use(apiProxy) 安装 @mpxjs/api-proxy。
mpx.preload({ url: '/pages/detail?id=1' })
// 用户决定进入时再调用；也可以不经过 preload 直接打开。
mpx.navigateTo({ url: '/pages/detail?id=2' })
```

## 实例与生命周期 {#lifecycle}

- `wasPreloaded` 是 RN 页面实例的只读创建标识，在 beforeCreate/setup/created/onLoad 前确定，此后不变。预加载阶段创建为 true；若连续 preload、navigateTo 后才在正式栈创建，则为 false。不能据此判断当前是否显示或初始化是否完成。
- 预加载提前执行创建与 onLoad，onReady 也可能提前；未展示时不执行 onShow/onHide。正式进入复用实例执行 onShow，不重跑 onLoad/onReady。页面组件的 pageLifetimes 随实际显示状态派发。
- 框架不重置业务保存的参数或状态；曝光、播放等显示相关副作用应放在 onShow，未使用的预加载实例也需要在卸载时清理资源。

## 路由与通信 {#routing}

同名重复 preload 替换候选并生成新 key，即使参数相同也不幂等；不同页面候选可并存。navigateTo 可复用同名候选，以本次跳转参数为准。例如预加载 id=1、正式进入 id=2，可能仍是同一实例，但 onLoad 只收到过 id=1。

redirectTo 保持 replace 行为，不消费预加载候选；reLaunch 清空候选；navigateBack 不额外清空候选。不提供取消、TTL 或候选数量上限。

navigateTo 复用已创建实例时保留其 EventChannel，正式跳转再添加 events 监听；不会补发预加载期间已经发送的消息。候选实例尚未创建时，按候选 route key 暂存通道，实例创建时领取；普通导航沿用现有临时槽交接。getCurrentPages 仅包含正式栈页面。

仅候选变化也会触发 `rnConfig.onStateChange`，不代表页面跳转或曝光。宿主应根据实际 routes/index 处理栈同步。页面预加载与 JSON `preloadRule` 的分包下载是不同能力；提前挂载会占用 CPU 和内存，收益需按页面测量。
