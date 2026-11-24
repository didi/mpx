# RN 环境 API

## preload

`mpx.preload({ url })` 可在 React Navigation 7.x Native Stack 中提前创建目标页面。它接受相对路径和 query，同步返回 `undefined`。预加载与正式跳转建议使用相同的参数。

预加载时会调用 `onLoad(rawQuery, decodedQuery, true)`。用 `navigateTo` 正式进入并复用该实例时触发 `onShow`，此时可获取本次跳转的 EventChannel。后续显示时沿用同一个通道，监听器只需注册一次。参见 [preload API](../../../../../docs-vitepress/api-proxy/route/preload.md)。
