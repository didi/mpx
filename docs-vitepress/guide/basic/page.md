# 页面

对于 Mpx 项目中的每个页面，都需要在对应的 `.mpx` 文件中进行定义，指定页面的初始数据、生命周期回调、事件处理函数等，并且在 `app.mpx` 中通过 `pages` 数组进行注册。

```html
<script type="application/json">
  {
    "pages": [
      "./pages/index",
      "./pages/second"
    ]
  }
</script>
```

## 页面模板

页面模板的写法与组件模板相同，具体可参考[模版语法](./template.md)。页面模板与页面数据结合后生成的节点树，将被渲染到页面上。

## 页面构造

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

### 生命周期

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

### data

`data` 是页面第一次渲染使用的初始数据。页面加载时，`data` 将会以 JSON 字符串的形式由逻辑层传至渲染层，因此 `data` 中的数据必须是可以转成 JSON 的类型：字符串，数字，布尔值，对象，数组。

```js
import { createPage } from '@mpxjs/core'

createPage({
  data: {
    message: 'Hello MINA!'
  }
})
```

### methods

组件的方法，包括事件响应函数和任意的自定义方法。在 Mpx 中，由于底层使用 Component 构造器，自定义方法必须放在 `methods` 对象中。

```js
import { createPage } from '@mpxjs/core'

createPage({
  data: {
    text: ''
  },
  methods: {
    viewTap() {
      this.text = 'Clicked!'
    }
  }
})
```
> **注意**
> - Mpx 底层默认使用 Component 构造器创建页面，因此自定义方法需要放置在 `methods` 选项中。
> - Mpx 对 `data` 进行了响应式处理，直接修改 `this.text = 'xxx'` 即可驱动视图更新，无需调用 `this.setData`。

### computed

`computed` 选项用于声明依赖于其他数据的计算属性。计算属性的结果会被缓存，只有在依赖发生变化时才会重新计算。

```js
import { createPage } from '@mpxjs/core'

createPage({
  data: {
    firstName: 'John',
    lastName: 'Doe'
  },
  computed: {
    fullName() {
      return this.firstName + ' ' + this.lastName
    }
  }
})
```
详情请查看[计算属性](https://mpxjs.cn/guide/advance/computed.html)

### watch

`watch` 选项用于监听数据的变化并执行相应的回调函数。

```js
import { createPage } from '@mpxjs/core'

createPage({
  data: {
    question: '',
    answer: 'Questions usually contain a question mark. ;-)'
  },
  watch: {
    // 只要 question 发生改变，这个函数就会执行
    question(newQuestion, oldQuestion) {
      if (newQuestion.indexOf('?') > -1) {
        this.getAnswer()
      }
    }
  }
})
```
详情请查看[侦听器](https://mpxjs.cn/guide/advance/watch.html)

### setup

`setup` 函数在页面创建时执行，返回页面所需的数据和方法，是组合式 API 的核心。

```js
import { createPage, ref, onLoad, onShow } from '@mpxjs/core'

createPage({
  setup() {
    const count = ref(0)
    const increment = () => {
      count.value++
    }
    
    // 注册生命周期钩子
    onLoad(() => {
      console.log('Page Load')
    })

    onShow(() => {
      console.log('Page Show')
    })

    return {
      count,
      increment
    }
  }
})
```
详情请查看[组合式 API](../composition-api/composition-api.md)

> **注意**
> - Mpx 底层默认使用 Component 构造器创建页面，因此自定义方法需要放置在 `methods` 选项中。

## 页面样式

页面样式主要用于控制页面内的元素外观。

### 全局样式与局部样式

定义在 `app.mpx` 中的样式为全局样式，作用于每一个页面。在页面的 `wxss` 文件中定义的样式为局部样式，只作用于当前页面，并会覆盖全局样式中相同的选择器。

```css
/* app.mpx */
.container {
  padding: 20px;
}

/* page.mpx */
.container {
  padding: 10px; /* 覆盖全局样式 */
}
```

### 样式导入

可以使用 `@import` 语句导入外联样式表。

```css
@import './common.wxss';
```

## 页面配置

`app.json` 中的部分配置，也支持对单个页面进行配置，可以在页面对应的 `<script type="application/json">` 块中来对本页面的表现进行配置。

页面中配置项在当前页面会覆盖 `app.json` 中相同的配置项（样式相关的配置项属于 `app.json` 中的 `window` 属性，但这里不需要额外指定 `window` 字段）。

### 配置项

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

### 配置示例

```json
{
  "navigationBarBackgroundColor": "#ffffff",
  "navigationBarTextStyle": "black",
  "navigationBarTitleText": "微信接口功能演示",
  "backgroundColor": "#eeeeee",
  "backgroundTextStyle": "light"
}
```

更多配置项细节请参考[小程序页面配置](https://developers.weixin.qq.com/miniprogram/dev/reference/configuration/page.html)
