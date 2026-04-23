# Mpx 扩展组件

除基础组件外，Mpx 额外提供一些扩展组件。扩展组件需要在页面或组件的 `usingComponents` 中注册后使用。

```html
<script type="application/json">
{
  "usingComponents": {
    "section-list": "@mpxjs/webpack-plugin/lib/runtime/components/extends/section-list"
  }
}
</script>
```

Mpx 会根据当前编译的目标平台（wx/ali/web/ios/android/harmony），自动解析到对应平台的扩展组件实现。


## section-list

跨端虚拟列表组件，可自定义分组头、列表头、列表项，自动分段渲染兼容各端。

支持平台：微信小程序、支付宝小程序、Web、RN

### 属性

| 属性名                  | 类型         | 默认值   | 说明                   | 支持平台  |
|-----------------------|-------------|----------|------------------------|-----------|
| height                | String/Number | 100%    | 组件高度                | 微信小程序、支付宝小程序、Web、RN    |
| width                 | String/Number | 100%    | 组件宽度                | 微信小程序、支付宝小程序、Web、RN    |
| listData              | Array       | []       | 列表数据，如需使用列表分组头 `section-header`，对应 item 的数据需要包含 `isSectionHeader: true` 标识    | 微信小程序、支付宝小程序、Web、RN    |
| enable-sticky          | Boolean     | false    | 启用分组吸顶            | 微信小程序、支付宝小程序、Web、RN<br>⚠️微信小程序环境，需要使用 skyline 渲染模式，webview 模式不支持；web 环境仅支持移动端，不支持 pc 端   |
| scroll-with-animation   | Boolean     | false    | 滚动动画                | 微信小程序、支付宝小程序、Web、RN    |
| useListHeader         | Boolean     | false     | 使用自定义列表头        | 微信小程序、支付宝小程序、Web、RN    |
| listHeaderData        | Object      | {}       | 列表头数据              | 微信小程序、支付宝小程序、Web、RN    |
| useListFooter       | Boolean     | false     | 使用自定义列表页脚        | 微信小程序、支付宝小程序、Web、RN    |
| listFooterData        | Object      | {}       | 列表头数据              | 微信小程序、支付宝小程序、Web、RN    |
| generic:recycle-item         | String      |       | 列表项，抽象节点组件名，对应组件需要通过 usingComponents 注册               | 微信小程序、支付宝小程序、Web、RN  |
| generic:section-header    | String      |       | 列表分组头，抽象节点组件名，对应组件需要通过 usingComponents 注册          | 微信小程序、支付宝小程序、Web、RN  |
| generic:list-header     | String      |       | 列表头，抽象节点组件名，对应组件需要通过 usingComponents 注册       | 微信小程序、支付宝小程序、Web、RN  |
| generic:list-footer     | String      |       | 列表页脚，抽象节点组件名，对应组件需要通过 usingComponents 注册       | 微信小程序、支付宝小程序、Web、RN  |
| itemHeight            | Object      | {}       | 列表项高度配置（支持 getter/value），必须配置    | 微信小程序、支付宝小程序、Web、RN      |
| sectionHeaderHeight   | Object      | {}       | 分组头部高度配置（getter/value），若使用了自定义分组头必须配置      | 微信小程序、支付宝小程序、Web、RN      |
| listHeaderHeight      | Object      | {}       | 列表头部高度配置（getter/value），若使用了列表头必须配置      | 微信小程序、支付宝小程序、Web、RN      |
| bufferScale           | Number      | 1        | 渲染缓冲区行数（虚拟滚动优化）    | 仅支付宝小程序/web支持 |
| minRenderCount        | Number      | 10       | 最小渲染项目数                 | 仅支付宝小程序/web支持 |

#### `itemHeight`/`sectionHeaderHeight`/`listHeaderHeight` 格式说明

高度相关属性支持如下格式：

```js
height: {
  value: 400, // 定高
  getter: function (item, index) {
    const seed = item.id % 2 || 0
    const heights = [100, 300]
    return heights[seed]
  }
}
```

**说明：**
- `value`：默认高度（所有项相同高度时直接用 value 即可）。
- `getter`：函数形式，可接收每一项的数据和索引，按需返回不同高度（动态高度需求时使用）。
- `getter` 优先级 大于 value。

> 建议性能要求较高（如超大数据集）优先使用 `value` 定高。

### 事件

| 事件名                 | 说明                             | 支持平台     |
|-----------------------|-----------------------------------|--------------|
| bindscroll                | 滚动时触发，返回滚动信息            | 微信小程序、支付宝小程序、Web、RN       |
| bindscrolltolower         | 滚动到底部/触底通知                 | 微信小程序、支付宝小程序、Web、RN       |
| bindscrollToIndex         | 组件方法，滚动到指定索引             | 微信小程序、支付宝小程序、Web、RN       |

`scrollToIndex({ index, animated, viewPosition })` 参数说明：
- `index`：目标索引
- `animated`：是否滚动动画
- `viewOffset`：滚动偏移量
- `viewPosition`：滚动定位，0:顶部, 0.5:中间, 1:底部

### 用法示例

```js
<section-list
  generic:recycle-item="normal-recycle-item"
  generic:section-header="section-header"
  generic:list-header="list-header"
  width="{{width}}"
  height="{{height}}"
  listData="{{dataList}}"
  itemHeight="{{ itemHeight }}"
  sectionHeaderHeight="{{headerHeight}}"
  listHeaderHeight="{{listHeaderHeight}}"
  bufferScale="{{bufferScale}}"
  useListHeader="{{true}}"
  enable-sticky="{{true}}"
/>
<script>
  import mpx, { createPage, createComponent } from '@mpxjs/core'

  const generateData = (itemsPerSection) => {
    const data = []

    for (let i = 0; i < 10; i++) {
      data.push({
        isSectionHeader: true,  // 标识该行使用 section-header 对应的抽象节点渲染
        title: `Section ${i + 1}`
      })

      // 添加该 section 的 items
      for (let j = 0; j < itemsPerSection; j++) {
        const itemNumber = i * itemsPerSection + j + 1
        data.push({
          id: itemNumber,
          title: `Item ${itemNumber}`,
          description: `This is item number ${itemNumber} in section ${i + 1}`
        })
      }
    }
    return data
  }

  createPage({
    data: {
      width: 0,
      height: 0,
      bufferScale: 5,
      dataList: generateData(100),
      itemHeight: {
        getter: function (item, index) {
          const seed = item.id % 2 || 0
          const heights = [100, 300]
          return heights[seed]
        }
      },
      headerHeight: {
        value: 50
      },
      listHeaderHeight: {
        value: 100
      }
    },
    onLoad() {
      this.height = mpx.getWindowInfo().windowHeight
      this.width = mpx.getWindowInfo().windowWidth
    }
  })
  </script>
  <script type="application/json">
  {
    "usingComponents": {
      "section-list": "@mpxjs/webpack-plugin/lib/runtime/components/extends/section-list",
      "normal-recycle-item": "@/components/recycle-item",
      "section-header": "@/components/section-header",
      "list-header": "@/components/list"
    }
  }
</script>
```

### 其它说明

- 当使用了列表项、列表头或者自定义分组头，必须配置对应 item/sectionHeader/listHeader 的 height 相关参数，否则会出现滚动异常情况。
- 可直接调用 ref 实例执行 `scrollToIndex` 方法实现滚动。
- 如果用户滑动的速度超过渲染的速度，则会先看到空白的内容，这是为了长列表优化不得不作出的妥协。
- 当某行滑出渲染区域之外后，其内部状态将不会保留。
- 在 RN 环境，section-list 通过 RN 提供的 SectionList 实现分组吸顶。受 RN 底层实现机制限制，开启 `enable-sticky` 且快速滑动时，自定义分组头有时会出现闪烁现象。此问题需要等待 RN 官方修复，我们会持续关注并跟进。
- 若某行需要使用 `section-header` 对应的抽象节点渲染，则该行数据必须包含 `isSectionHeader: true` 字段；否则默认使用 `recycle-item` 对应的抽象节点渲染


## sticky-section

吸顶布局容器，仅支持作为 `<scroll-view>` 的直接子节点

支持平台：微信小程序（仅 skyline 支持）、支付宝小程序、Web、RN

### 用法示例

```html
<template>
  <scroll-view>
    <sticky-section>
      <sticky-header>这是会吸顶的内容</sticky-header>
    </sticky-section>
  </scroll-view>
</template>

<script type="application/json">
{
  "usingComponents": {
    "sticky-section": "@mpxjs/webpack-plugin/lib/runtime/components/extends/sticky-section"
  }
}
</script>
```


## sticky-header

吸顶头部组件，支持在滚动容器中实现元素吸顶效果。仅支持作为 `<scroll-view>` 的直接子节点或 `sticky-section` 组件直接子节点

支持平台：微信小程序（仅 skyline 支持）、支付宝小程序、Web、RN

### 属性

| 属性名 | 类型 | 默认值 | 说明 | 支持平台 |
|-------|------|--------|------|---------|
| offsetTop | Number | 0 | 吸顶距离顶部的偏移量 | 微信小程序、支付宝小程序、Web、RN |
| padding | Array | - | 内边距配置 [top, right, bottom, left] | 微信小程序、支付宝小程序、Web、RN |
| scrollViewId | String | '' | 滚动容器的 id, 支付宝环境必传, 值与选择器 id 值一致 | 支付宝小程序 |
| stickyId | String | '' | 吸顶元素的唯一标识，支付宝环境必传，值与选择器 id 值一致 | 支付宝小程序 |
| enablePolling | Boolean | false | 启用轮询刷新 | 支付宝小程序 |
| pollingDuration | Number | 300 | 轮询间隔时间（毫秒） | 支付宝小程序 |

### 事件

| 事件名 | 说明 | 支持平台 |
|-------|------|---------|
| stickontopchange | 吸顶状态改变时触发，返回 { isStickOnTop, id } | 微信小程序、支付宝小程序、Web、RN |

**注意**：
- 支付宝小程序中该功能基于 IntersectionObserver 实现，但在支付宝平台上，IntersectionObserver 的回调可能存在触发不及时或不触发的情况，进而导致 stickontopchange 事件无法及时触发，或 sticky-header 吸附位置异常。

为此我们提供了 enablePolling 属性。开启后将通过定时轮询的方式校验 sticky-header 当前吸附状态是否正确，若发现异常会自动进行修正。建议在支付宝平台根据实际情况按需开启该配置。

- RN 环境的 sticky-header 更适用于内容稳定，状态不常变更的场景使用，目前如果 sticky-header 还在动画过程中就触发组件更新（如在bindstickontopchange 回调中立刻更新 state）、scroll-view 内容高度由多变少、通过修改 scroll-into-view、scroll-top 让 scroll-view 滚动，以上场景在安卓上都可能会导致闪烁或抖动
  

### 用法示例

```html
<template>
  <scroll-view id="scrollViewContainer" scroll-y>
    <sticky-header 
      scroll-view-id="scrollViewContainer"
      sticky-id="header1"
      offset-top="0"
      bind:stickontopchange="handleStickyChange">
      <view>这是会吸顶的内容</view>
    </sticky-header>
  </scroll-view>
</template>

<script type="application/json">
{
  "usingComponents": {
    "sticky-header": "@mpxjs/webpack-plugin/lib/runtime/components/extends/sticky-header"
  }
}
</script>
```

