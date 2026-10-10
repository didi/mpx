## mpx.onPageNotFound(function listener)

监听启动入口页面不存在事件。

支持情况：微信、RN、Web。

### 参数 {#parameters}

`listener` 为监听函数，收到以下参数：

| 属性 | 类型 | 说明 |
| --- | --- | --- |
| path | string | 原始缺失页面路径，不含开头 `/` 和 query。 |
| query | Object | 原始入口参数。RN 对应 `parseAppProps` 返回的 `initialParams`，未传时为 `{}`。 |
| isEntryPage | boolean | 是否为启动入口。RN 与 Web 当前仅支持入口通知，固定为 `true`。 |

### RN 与 Web 行为 {#rn-web-behavior}

- 先回退并初始化应用首页，再在路由可用时通知。监听函数可调用 `redirectTo / reLaunch` 恢复到已注册页面，缺失入口参数不会传入首页。
- 在启动前或 App 的 `onLaunch` 中注册监听；通知结束后注册不会补发旧事件。
- 与 `createApp({ onPageNotFound })` 共用触发时机和参数，两种方式均声明时都会被调用。两者都未声明时，通过 Mpx 的 `error` 报告缺失入口。
- 运行中的路由 API 跳转失败通过 `fail → complete` 处理，不触发本事件；已注册页面的加载或执行错误也不触发。RN 尚不支持 `switchTab`。
- 每次启动最多通知一次。RN 根组件销毁重建会重新检查入口，普通重渲染和前后台切换不重复通知。Web 的 SSR 服务端不派发该事件，自定义兜底路由已匹配时也不触发。
- 该 API 默认不参与 Promise 化。

### 示例代码 {#example-code}

```js
import mpx, { createApp } from '@mpxjs/core'
import apiProxy from '@mpxjs/api-proxy'

mpx.use(apiProxy)

const listener = ({ path, query }) => {
  console.warn('入口页面不存在', path, query)
  mpx.redirectTo({ url: '/pages/index' }) // 已注册的普通页面
}

mpx.onPageNotFound(listener)
createApp({})

// 不再需要监听时，调用 mpx.offPageNotFound(listener)
```

取消监听见 [mpx.offPageNotFound](./offPageNotFound.md)。
