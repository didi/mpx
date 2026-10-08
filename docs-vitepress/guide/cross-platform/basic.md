# 跨端输出配置 {#cross-platform-output-config}

Mpx以微信增强DSL为基础，支持跨端输出至多端小程序、web和客户端，包括支付宝、百度、抖音、京东、QQ等多端小程序平台，基于Vue的web平台，和基于react-native的ios、android及鸿蒙平台。

## 跨端输出配置 {#cross-platform-output-config-1}

配置mpx进行跨端输出十分简单，找到项目构建的webpack配置，在@mpxjs/webpack-plugin的配置参数中设置mode和srcMode参数即可。

```javascript
new MpxwebpackPlugin({
  // mode为mpx编译的目标平台，可选值有(wx|ali|swan|qq|tt|jd|web|ios|android|harmony)
  mode: 'ali',
  // srcMode为mpx编译的源码平台，目前仅支持wx   
  srcMode: 'wx'
})
```

对于使用 @mpxjs/cli 创建的项目，可以通过在 `npm script` 当中定义 `targets` 来设置编译的目标平台，多个平台标识以`,`分隔。

```javascript
// 项目 package.json
{
  "script": {
    "build:cross": "mpx-cli-service build --targets=wx,ali,ios,android"
  }
}
```

## 支持的平台 {#supported-platforms}

### 小程序平台 {#miniprogram-platform}
- 微信小程序 (wx)
- 支付宝小程序 (ali)
- 百度小程序 (swan)
- QQ小程序 (qq)
- 抖音小程序 (tt)
- 京东小程序 (jd)

### Web平台 {#web-platform}
- 基于Vue的Web应用 (web)

### 客户端平台 {#client-platform}
- iOS应用 (ios)
- Android应用 (android)
- 鸿蒙应用 (harmony)

## 支付宝文本与滚动条兼容 {#ali-text-scrollbar-compat}

当 `mode` 为 `ali` 时，Mpx 会在 App 全局样式之前加载支付宝兼容样式，其中包含 `text { white-space: inherit }`。因此，`text` 默认会继承父节点的换行方式；业务在 App 样式、页面样式、组件样式或行内样式中显式声明 `white-space` 时，后加载的业务规则仍可覆盖该默认值。

该默认值只处理换行继承。省略号布局仍需由业务设置宽度、`overflow`、`text-overflow` 等必要样式。

使用微信语法开发并输出支付宝小程序时，`scroll-view` 的 `show-scrollbar` 支持以下布尔契约：

```html
<scroll-view
  scroll-y="{{true}}"
  show-scrollbar="{{showScrollbar}}"
>
  <view>列表内容</view>
</scroll-view>
```

- `show-scrollbar="{{false}}"` 会为当前节点添加滚动条隐藏样式。
- 动态值仅在结果严格等于布尔值 `false` 时隐藏；`undefined`、`null`、`0` 和字符串 `"false"` 均不会触发隐藏。
- `true` 只移除 Mpx 添加的隐藏样式，恢复宿主默认行为，不会强制宿主显示滚动条。
- 支付宝原生语法源码（`srcMode: 'ali'`）不会转换该属性。

滚动条最终是否可见仍受支付宝客户端、基础库、系统和设备影响，建议在目标真机上验证横向、纵向及嵌套滚动场景。该兼容样式由完整 App 构建的全局样式入口提供；独立分包、插件产物及单独编译的页面或组件不在自动覆盖范围内。

支付宝与 Web 的 `.mpx-root-view { display: initial }`、`page { line-height: normal }` 也作为框架默认样式先于用户 App 样式加载。业务同优先级声明可以覆盖这些默认值。

## 构建命令 {#build-command}

### 单平台构建 {#single-platform-build}
```bash
# 构建微信小程序 {#build-wechat-miniprogram}
npm run build:wx

# 构建支付宝小程序 {#build-alipay-miniprogram}
npm run build:ali

# 构建Web应用 {#build-web-app}
npm run build:web

# 构建iOS应用 {#build-ios-app}
npm run build:ios
```

### 多平台构建 {#multi-platform-build}
```bash
# 构建所有支持的平台 {#build-all-platforms}
npm run build:cross

# 构建指定的多个平台 {#build-specific-platforms}
mpx-cli-service build --targets=wx,ali,web
```

## 项目结构 {#project-structure}

跨端项目的典型目录结构：

```
src/
├── components/          # 公共组件
├── pages/              # 页面文件
├── utils/              # 工具函数
├── styles/             # 样式文件
├── app.mpx             # 应用入口
└── app.json            # 应用配置
```

## 下一步 {#next-step}

- [条件编译机制](conditional.md) - 了解如何处理平台差异
- [平台差异处理](./differences.md) - 掌握差异抹平技巧
