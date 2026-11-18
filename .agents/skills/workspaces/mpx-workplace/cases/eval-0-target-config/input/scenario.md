# 多端配置接入

工程使用当前仓库的 Mpx 编译语义：mode 仅筛选目标，srcMode 仅选择源码方言。源码均为微信语法。RN 输出包括 ios/android/harmony。现有 CLI/webpack loader 链已可用，请给出合入现有配置的插件选项，不另造构建工具。

当前 MpxWebpackPlugin 选项由下列逻辑生成：

```js
const target = process.env.MPX_MODE
const options = {
  mode: target === 'wx' ? 'skyline' : target === 'ios' ? 'rn' : target,
  srcMode: target,
  externalClasses: ['accent-class']
}
```

当前默认引用为 `./components/status-card.mpx`，默认文件和 status-card.ios.mpx 都存在，android/harmony 没有条件文件。后者内容为：

```html
<template mode="ios"><view bindtap="open"><text>原生状态</text></view></template>
<script>
import { createComponent } from '@mpxjs/core'
createComponent({ methods: { open () {} } })
</script>
<script type="application/json">{"component":true}</script>
```

`src/device-label.js` 顶层 `import { Platform } from 'react-native'`，导出的函数仅在 `__mpx_mode__ === 'ios'` 时返回 Platform.OS，其他分支返回 'mini-or-web'。希望 RN 三端都能显示对应原生平台，其余端完全不依赖 react-native。RN 原生工程已提供该依赖。

app.mpx 当前注册 `pages/home`，JSON 顶层误写 `defaultDisplayBlock:true`、`defaultContentBox:true`、`component2:true`；home 页面只配置 `renderer:'skyline'`。home 已有业务自定义导航和内部滚动区域，无需重新实现它们。微信灰度回退到 WebView 时必须可用；支付宝/RN/Web 不应收到微信渲染配置。

`src/components` 中组件已声明并使用 custom-class、i-class、accent-class 三个外部类。保留三者。支付宝开发者工具未开启 component2。给出 app/page 的动态 JSON 区块与需要的支付宝工程文件，说明文件落点。
