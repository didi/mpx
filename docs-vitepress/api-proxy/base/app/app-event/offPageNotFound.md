## mpx.offPageNotFound(function listener)

移除通过 [mpx.onPageNotFound](./onPageNotFound.md) 注册的监听函数。

支持情况：微信、RN、Web。

### 参数 {#parameters}

`listener` 可选，需为注册时的同一个函数对象。不传时移除全部 API 监听函数。

RN 与 Web 中，此方法不移除 `createApp({ onPageNotFound })` 声明的 App 生命周期回调。该 API 默认不参与 Promise 化。

### 示例代码 {#example-code}

```js
const listener = (res) => console.log('缺失入口', res.path)

mpx.onPageNotFound(listener)
mpx.offPageNotFound(listener) // 移除指定监听
mpx.offPageNotFound() // 移除全部 API 监听
```
