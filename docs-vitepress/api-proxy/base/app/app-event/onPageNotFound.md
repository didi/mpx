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
