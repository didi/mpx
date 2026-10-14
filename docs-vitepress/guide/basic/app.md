# 创建 App {#create-app}

Mpx 应用需要在 `app.mpx` 中调用 `createApp` 方法注册App实例，绑定生命周期回调函数、错误监听和页面不存在监听函数等。

## createApp

`createApp` 是 Mpx 提供的用于注册小程序实例的方法，它接受一个 Object 类型的参数，指定小程序的生命周期回调等。

```html
<script>
  import { createApp } from '@mpxjs/core'

  createApp({
    onLaunch (options) {
      // Do something initial when launch.
      console.log('App Launch')
    },
    onShow (options) {
      // Do something when show.
      console.log('App Show')
    },
    onHide () {
      // Do something when hide.
      console.log('App Hide')
    },
    onError (msg) {
      console.log(msg)
    },
    globalData: 'I am global data'
  })
</script>

<script type="application/json">
  {
    "pages": [
      "./pages/index/index"
    ],
    "window": {
      "backgroundTextStyle": "light",
      "navigationBarBackgroundColor": "#fff",
      "navigationBarTitleText": "WeChat",
      "navigationBarTextStyle": "black"
    }
  }
</script>

<style>
  /* 全局样式 */
  page {
    background-color: #f8f8f8;
  }
</style>
```

### 生命周期 {#lifecycle}

*   **onLaunch(Object object)**
    小程序初始化完成时触发，全局只触发一次。
    *   `object` (Object): 启动参数

*   **onShow(Object object)**
    小程序启动，或从后台进入前台显示时触发。
    *   `object` (Object): 启动参数

*   **onHide()**
    小程序从前台进入后台时触发。

*   **onError(String error)**
    小程序发生脚本错误或 API 调用报错时触发。
    *   `error` (String): 错误信息

*   **onPageNotFound(Object object)**
    小程序要打开的页面不存在时触发。
    *   `object` (Object): 页面不存在的详细信息

*   **onUnhandledRejection(Object object)**
    小程序有未处理的 Promise 拒绝时触发。
    *   `object` (Object): 拒绝的详细信息

*   **onThemeChange(Object object)**
    系统切换主题时触发。
    *   `object` (Object): 主题信息

## getApp

整个小程序只有一个 App 实例，是全部页面共享的。开发者可以通过 `getApp` 方法获取到全局唯一的 App 实例，获取 App 上的数据或调用开发者注册在 App 上的函数。

```js
// xxx.js
const appInstance = getApp()
console.log(appInstance.globalData) // I am global data
```

> **注意**
> - 不要在定义于 `App()` 内的函数中，或调用 `App` 前调用 `getApp()` ，使用 `this` 就可以拿到 app 实例。
> - 通过 `getApp()` 获取实例之后，不要私自调用生命周期函数。

## App 样式 {#app-style}

在 `app.mpx` 中定义的样式为全局样式，会作用于应用中的所有页面。

```html
<!-- app.mpx -->
<style>
  page {
    background-color: #f8f8f8;
    height: 100%;
    font-size: 32rpx;
    line-height: 1.6;
  }
</style>
```

> **注意**
> - 全局样式会影响所有页面，但页面局部样式（在页面的 `<style>` 中定义的样式）优先级高于全局样式。
> - 可以在 `page` 选择器中定义通用的背景色、字体等样式。

## App 配置 {#app-config}

Mpx 应用的全局配置位于 `app.mpx` 的 JSON 部分，对应用进行全局配置，决定页面文件的路径、窗口表现、设置网络超时时间、设置多 tab 等。

### 配置项 {#config-items}

| 属性 | 类型 | 必填 | 描述 |
| :--- | :--- | :--- | :--- |
| pages | String[] | 是 | 页面路径列表 |
| window | Object | 否 | 全局的默认窗口表现 |
| tabBar | Object | 否 | 底部 tab 栏的表现 |
| networkTimeout | Object | 否 | 网络超时时间 |
| debug | Boolean | 否 | 是否开启 debug 模式，默认关闭 |
| subpackages | Object[] | 否 | 分包结构配置 |
| preloadRule | Object | 否 | 分包预下载规则 |
| workers | String | 否 | Worker 代码放置的目录 |
| requiredBackgroundModes | String[] | 否 | 需要在后台使用的能力，如「音乐播放」 |
| plugins | Object | 否 | 使用到的插件 |
| resizable | Boolean | 否 | iPad 小程序是否支持屏幕旋转 |
| usingComponents | Object | 否 | 全局自定义组件配置 |
| permission | Object | 否 | 小程序接口权限相关设置 |
| sitemapLocation | String | 是 | 指明 sitemap.json 的位置 |
| style | String | 否 | 指定使用升级后的weui样式 |
| useExtendedLib | Object | 否 | 指定需要引用的扩展库 |
| entranceDeclare | Object | 否 | 微信消息用小程序打开 |
| darkmode | Boolean | 否 | 小程序支持 DarkMode |
| themeLocation | String | 否 | 指明 theme.json 的位置 |
| lazyCodeLoading | String | 否 | 配置自定义组件代码按需注入 |
| singlePage | Object | 否 | 单页模式相关配置 |

### pages

用于指定小程序由哪些页面组成，每一项都对应一个页面的 路径（含文件名） 信息。文件名不需要写文件后缀，Mpx 会自动去寻找对应位置的 .mpx 文件进行处理。

**注意**：
1. 数组的第一项代表小程序的初始页面（首页）。
2. 小程序中新增/减少页面，都需要对 pages 数组进行修改。

```json
{
  "pages": [
    "pages/index/index",
    "pages/logs/logs"
  ]
}
```

### window

用于设置应用的状态栏、导航条、标题、窗口背景色。

| 属性 | 类型 | 默认值 | 描述 |
| :--- | :--- | :--- | :--- |
| navigationBarBackgroundColor | HexColor | #000000 | 导航栏背景颜色 |
| navigationBarTextStyle | String | white | 导航栏标题、状态栏颜色，仅支持 black / white |
| navigationBarTitleText | String |  | 导航栏标题文字内容 |
| navigationStyle | String | default | 导航栏样式，仅支持 default / custom |
| backgroundColor | HexColor | #ffffff | 窗口的背景色 |
| backgroundTextStyle | String | dark | 下拉 loading 的样式，仅支持 dark / light |
| enablePullDownRefresh | Boolean | false | 是否开启全局的下拉刷新 |
| onReachBottomDistance | Number | 50 | 页面上拉触底事件触发时距页面底部距离，单位为 px |

```json
{
  "window": {
    "navigationBarBackgroundColor": "#ffffff",
    "navigationBarTextStyle": "black",
    "navigationBarTitleText": "微信接口功能演示",
    "backgroundColor": "#eeeeee",
    "backgroundTextStyle": "light"
  }
}
```

### tabBar

如果当前应用是一个多 tab 应用（客户端窗口的底部或顶部有 tab 栏可以切换页面），可以通过 tabBar 配置项指定 tab 栏的表现，以及 tab 对应的页面的路径。

| 属性 | 类型 | 必填 | 默认值 | 描述 |
| :--- | :--- | :--- | :--- | :--- |
| color | HexColor | 是 | | tab 上的文字默认颜色 |
| selectedColor | HexColor | 是 | | tab 上的文字选中时的颜色 |
| backgroundColor | HexColor | 是 | | tab 的背景色 |
| borderStyle | String | 否 | black | tabbar 上边框的颜色， 仅支持 black / white |
| list | Array | 是 | | tab 的列表，详见 list 属性说明，最少 2 个、最多 5 个 tab |
| position | String | 否 | bottom | tabBar 的位置，仅支持 bottom / top |
| custom | Boolean | 否 | false | 自定义 tabBar |

**list 接受一个数组，只能配置最少 2 个、最多 5 个 tab。tab 按数组的顺序排序，每个项都是一个对象，其属性值如下：**

| 属性 | 类型 | 必填 | 描述 |
| :--- | :--- | :--- | :--- |
| pagePath | String | 是 | 页面路径，必须在 pages 中存在 |
| text | String | 是 | tab 上按钮文字 |
| iconPath | String | 否 | 图片路径，icon 大小限制为 40kb，建议尺寸为 81px * 81px，不支持网络图片 |
| selectedIconPath | String | 否 | 选中时的图片路径，icon 大小限制为 40kb，建议尺寸为 81px * 81px，不支持网络图片 |

```json
{
  "tabBar": {
    "list": [
      {
        "pagePath": "pages/index/index",
        "text": "首页"
      },
      {
        "pagePath": "pages/logs/logs",
        "text": "日志"
      }
    ]
  }
}
```

更多配置详情请参考[微信小程序全局配置](https://developers.weixin.qq.com/miniprogram/dev/reference/configuration/app.html)。
