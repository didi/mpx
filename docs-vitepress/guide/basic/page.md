# 创建页面 {#create-page}

对于 Mpx 项目中的每个页面，都需要在对应的 `.mpx` 文件中进行定义，指定页面的初始数据、生命周期回调、事件处理函数等，并且在 `app.mpx` 中通过 `pages` 数组进行注册。

```html
<!-- app.mpx -->
<script type="application/json">
  {
    "pages": [
      "./pages/index",
      "./pages/second"
    ]
  }
</script>
```

## 页面模板 {#page-template}

页面模板的写法与组件模板相同，具体可参考[模版语法](./template.md)。页面模板与页面数据结合后生成的节点树，将被渲染到页面上。

## 页面构造 {#page-constructor}

`createPage` 是 Mpx 提供的用于构造页面的方法，它接受一个 Object 类型的参数，指定页面的初始数据、生命周期回调、事件处理函数等。

```html


<script>
  import { createPage } from '@mpxjs/core'

  createPage({
    data: {
      text: 'Init Data'
    },
    onLoad (options) {
      // Do some initialize when page load.
      console.log('Page Load')
    },
    onReady () {
      // Do something when page ready.
      console.log('Page Ready')
    },
    onShow () {
      // Do something when page show.
      console.log('Page Show')
    },
    onHide () {
      // Do something when page hide.
      console.log('Page Hide')
    },
    onUnload () {
      // Do something when page close.
      console.log('Page Unload')
    },
    onPullDownRefresh () {
      // Do something when pull down.
      console.log('Pull Down Refresh')
    },
    onReachBottom () {
      // Do something when page reach bottom.
      console.log('Reach Bottom')
    },
    onShareAppMessage () {
      // return custom share data when user share.
      console.log('Share App Message')
      return {
        title: 'My Mpx Page'
      }
    },
    methods: {
      // 自定义方法
      changeText () {
        this.text = 'Changed Data'
      }
    }
  })
</script>

<script type="application/json">
  {
    "navigationBarTitleText": "首页",
    "usingComponents": {}
  }
</script>

<style>
  .container {
    padding: 20px;
  }
</style>
```

### 页面构造选项 {#page-constructor-options}

Mpx 中页面的构造选项与组件高度一致，支持 `data`、`computed`、`watch`、`methods` 等选项。

| 选项 | 说明 | 详细介绍 |
| :--- | :--- | :--- |
| data | 页面的初始数据 | [data](./component.md#data) |
| computed | 计算属性，用于声明依赖于其他数据的计算属性 | [computed](./component.md#computed) |
| watch | 侦听器，用于监听数据的变化并执行相应的回调 | [watch](./component.md#watch) |
| methods | 页面方法，包括事件响应函数和任意的自定义方法 | [methods](./component.md#methods) |
| provide / inject | 依赖注入，用于跨层级组件分发数据 | [provide / inject](./component.md#provide-inject) |
| setup | 组合式 API 入口，返回页面所需的数据和方法 | [setup](./component.md#setup) |

> **注意**
> - Mpx 底层默认使用 Component 构造器创建页面，因此自定义方法需要放置在 `methods` 选项中，这与原生小程序 Page 构造器直接挂载在配置对象下不同。
> - Mpx 对 `data` 进行了响应式处理，直接修改 `this.text = 'xxx'` 即可驱动视图更新，无需调用 `this.setData`。

### 页面生命周期 {#page-lifecycle}

*   **onLoad(Object query)**
    页面加载时触发。一个页面只会调用一次，可以在 onLoad 的参数中获取打开当前页面路径中的参数。
    *   `query` (Object): 打开当前页面路径中的参数

*   **onShow()**
    页面显示/切入前台时触发。

*   **onReady()**
    页面初次渲染完成时触发。一个页面只会调用一次，代表页面已经准备妥当，可以和视图层进行交互。

*   **onHide()**
    页面隐藏/切入后台时触发。

*   **onUnload()**
    页面卸载时触发。

*   **onPullDownRefresh()**
    监听用户下拉刷新事件。

*   **onReachBottom()**
    监听用户上拉触底事件。

*   **onShareAppMessage(Object object)**
    监听用户点击页面内转发按钮（button 组件 open-type="share"）或右上角菜单“转发”按钮的行为，并自定义转发内容。

*   **onPageScroll(Object object)**
    监听用户滑动页面事件。

*   **onResize(Object object)**
    页面尺寸改变时触发。

*   **onTabItemTap(Object object)**
    当前是 tab 页时，点击 tab 时触发。

### 页面实例方法 {#page-instance-methods}

页面实例除了具备组件实例的大部分方法外，还具有一些特有的属性和方法。

| 方法/属性 | 说明 | 详细介绍 |
| :--- | :--- | :--- |
| route | 当前页面的路径，类型为 String | - |
| getPageId | 返回页面标识符 | [getPageId](./component.md#getpageid) |
| selectComponent | 使用选择器选择组件实例节点 | [selectComponent](./component.md#selectcomponent) |
| selectAllComponents | 使用选择器选择组件实例节点，返回全部匹配节点 | [selectAllComponents](./component.md#selectallcomponents) |
| createSelectorQuery | 创建一个 SelectorQuery 对象 | [createSelectorQuery](./component.md#createselectorquery) |
| createIntersectionObserver | 创建一个 IntersectionObserver 对象 | [createIntersectionObserver](./component.md#createintersectionobserver) |
| $watch | 动态创建一个侦听器 | [$watch](./component.md#$watch) |
| $forceUpdate | 强制更新视图 | [$forceUpdate](./component.md#$forceupdate) |
| $nextTick | 延迟到下次 DOM 更新循环之后执行 | [$nextTick](./component.md#$nexttick) |
| $set | 向响应式对象中添加一个 property | [$set](./component.md#$set) |
| $delete | 删除对象的 property | [$delete](./component.md#$delete) |

## 页面样式 {#page-style}

页面样式主要用于控制页面内的元素外观，在 Mpx 中，样式直接编写在 `.mpx` 单文件中的 `<style>` 标签内。

### 全局样式与局部样式 {#global-and-local-style}

定义在 `app.mpx` 的 `<style>` 标签中的样式为全局样式，作用于每一个页面。在页面的 `.mpx` 文件中 `<style>` 标签定义的样式为局部样式，只作用于当前页面，并会覆盖全局样式中相同的选择器。

```html
<!-- app.mpx -->
<style>
  .container {
    padding: 20px;
  }
</style>

<!-- page.mpx -->
<style>
  .container {
    padding: 10px; /* 覆盖全局样式 */
  }
</style>
```

### 样式导入 {#style-import}

可以使用 `@import` 语句导入外联样式表。

```html
<style>
  @import './common.wxss';
  
  .page-container {
    background-color: #f8f8f8;
  }
</style>
```

## 页面配置 {#page-config}

`app.json` 中的部分配置，也支持对单个页面进行配置，可以在页面对应的 `<script type="application/json">` 块中来对本页面的表现进行配置。

页面中配置项在当前页面会覆盖 `app.json` 中相同的配置项（样式相关的配置项属于 `app.json` 中的 `window` 属性，但这里不需要额外指定 `window` 字段）。

### 配置项 {#config-items}

| 属性 | 类型 | 默认值 | 描述 |
| :--- | :--- | :--- | :--- |
| navigationBarBackgroundColor | HexColor | #000000 | 导航栏背景颜色，如 #000000 |
| navigationBarTextStyle | string | white | 导航栏标题、状态栏颜色，仅支持 black / white |
| navigationBarTitleText | string | | 导航栏标题文字内容 |
| navigationStyle | string | default | 导航栏样式，仅支持 default/custom |
| backgroundColor | HexColor | #ffffff | 窗口的背景色 |
| backgroundTextStyle | string | dark | 下拉 loading 的样式，仅支持 dark / light |
| enablePullDownRefresh | boolean | false | 是否开启当前页面下拉刷新 |
| onReachBottomDistance | number | 50 | 页面上拉触底事件触发时距页面底部距离，单位为px |
| disableScroll | boolean | false | 设置为 true 则页面整体不能上下滚动 |
| usingComponents | Object | 否 | 页面自定义组件配置 |

### 配置示例 {#config-example}

```html
<script type="application/json">
  {
    "navigationBarBackgroundColor": "#ffffff",
    "navigationBarTextStyle": "black",
    "navigationBarTitleText": "微信接口功能演示",
    "backgroundColor": "#eeeeee",
    "backgroundTextStyle": "light"
  }
</script>
```

更多配置项细节请参考[小程序页面配置](https://developers.weixin.qq.com/miniprogram/dev/reference/configuration/page.html)
