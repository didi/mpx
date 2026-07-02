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

支持平台：RN

### 属性

| 属性名                  | 类型         | 默认值   | 说明                   |
|-----------------------|-------------|----------|------------------------|
| height                | String/Number | 100%    | 组件高度                |
| width                 | String/Number | 100%    | 组件宽度                |
| list-data | Array | [] | 列表数据，如需使用列表分组头 `section-header`，对应 item 的数据需要包含 `isSectionHeader: true` 标识；如需使用列表分组尾 `section-footer`，对应 item 的数据需要包含 `isSectionFooter: true` 标识 |
| enable-sticky          | Boolean     | false    | 启用分组吸顶            |
| scroll-event-throttle  | Number     | 0    | RN 环境特有属性，控制 scroll 事件触发频率                |
| enhanced               | Boolean     | false    | RN 环境特有属性，开启滚动增强能力                         |
| bounces                | Boolean     | true     | RN 环境特有属性，iOS 下边界弹性控制，需同时开启 `enhanced` |
| use-list-header         | Boolean     | false     | 使用自定义列表头        |
| list-header-data        | Object      | {}       | 列表头数据              |
| use-list-footer       | Boolean     | false     | 使用自定义列表页脚        |
| list-footer-data | Object | {} | 列表页脚数据 |
| generic:recycle-item         | String      |       | 列表项，抽象节点组件名，对应组件需要通过 usingComponents 注册               |
| generic:section-header    | String      |       | 列表分组头，抽象节点组件名，对应组件需要通过 usingComponents 注册          |
| generic:section-footer | String | | 列表分组尾，抽象节点组件名，对应组件需要通过 usingComponents 注册 |
| generic:list-header     | String      |       | 列表头，抽象节点组件名，对应组件需要通过 usingComponents 注册       |
| generic:list-footer     | String      |       | 列表页脚，抽象节点组件名，对应组件需要通过 usingComponents 注册       |
| item-height            | Object      | {}       | 列表项高度配置（支持 getter/value），必须配置    |
| section-header-height   | Object      | {}       | 分组头部高度配置（getter/value），若使用了自定义分组头必须配置      |
| section-footer-height | Object | {} | 分组尾部高度配置（getter/value），若使用了自定义分组尾必须配置 |
| list-header-height      | Number      | 0        | 列表头部高度，若使用了列表头必须配置  |
| enable-back-to-top      | Boolean     | false    | 点击状态栏时滚动到顶部，仅 iOS 环境支持 |
| end-reached-threshold   | Number      | 0.1      | 触底事件触发阈值 |
| refresher-enabled       | Boolean     | false    | 开启自定义下拉刷新 |
| refresher-triggered     | Boolean     | false    | 设置当前下拉刷新状态，true 表示已触发 |
| show-scrollbar          | Boolean     | true     | 滚动条显隐控制 |
| simultaneous-handlers   | Array\<Object> | []    | RN 环境特有属性，允许多个手势同时识别和处理 |
| wait-for                | Array\<Object> | []    | RN 环境特有属性，允许延迟激活处理某些手势 |

#### `item-height`/`section-header-height`/`section-footer-height` 格式说明 {#section-list-height-config}

`item-height`、`section-header-height`、`section-footer-height` 支持如下格式：

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

`list-header-height` 仅支持 Number 类型，用于声明列表头部固定高度，不支持 `getter` / `value` 配置对象。

### 事件

| 事件名                 | 说明                             |
|-----------------------|-----------------------------------|
| bindscroll                | 滚动时触发，`event.detail.scrollTop` 返回纵向滚动位置            |
| bindscrolltolower         | 滚动到底部/触底通知                 |
| bindrefresherrefresh      | 自定义下拉刷新被触发                |

### 方法 {#section-list-methods}

| 方法名 | 说明 |
|-------|------|
| scrollToIndex | 滚动到指定索引 |

`scrollToIndex({ index, animated, viewOffset, viewPosition })` 参数说明：
- `index`：目标索引
- `animated`：是否滚动动画
- `viewOffset`：滚动偏移量
- `viewPosition`：滚动定位，0:顶部, 0.5:中间, 1:底部

### 用法示例

```js
<section-list
  generic:recycle-item="normal-recycle-item"
  generic:section-header="section-header"
  generic:section-footer="section-footer"
  generic:list-header="list-header"
  width="{{width}}"
  height="{{height}}"
  list-data="{{dataList}}"
  item-height="{{ itemHeight }}"
  section-header-height="{{headerHeight}}"
  section-footer-height="{{footerHeight}}"
  list-header-height="{{listHeaderHeight}}"
  use-list-header="{{true}}"
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
      data.push({
        isSectionFooter: true,  // 标识该行使用 section-footer 对应的抽象节点渲染
        title: `Section ${i + 1} Footer`
      })
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
      footerHeight: {
        value: 50
      },
      listHeaderHeight: 100
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
      "section-footer": "@/components/section-footer",
      "list-header": "@/components/list"
    }
  }
</script>
```

### 其它说明

- 当使用了列表项、列表头、自定义分组头或者自定义分组尾，必须配置对应 `item-height`、`section-header-height`、`section-footer-height`、`list-header-height` 高度参数，否则会出现滚动异常情况。
- 可通过 ref 获取实例并调用 `scrollToIndex` 方法实现滚动。
- 如果用户滑动的速度超过渲染的速度，则会先看到空白的内容，这是为了长列表优化不得不作出的妥协。
- 当某行滑出渲染区域之外后，其内部状态将不会保留。
- 在 RN 环境，section-list 通过 RN 提供的 SectionList 实现分组吸顶。受 RN 底层实现机制限制，开启 `enable-sticky` 且快速滑动时，自定义分组头有时会出现闪烁现象。此问题需要等待 RN 官方修复，我们会持续关注并跟进。
- 若某行需要使用 `section-header` 对应的抽象节点渲染，则该行数据必须包含 `isSectionHeader: true` 字段；若某行需要使用 `section-footer` 对应的抽象节点渲染，则该行数据必须包含 `isSectionFooter: true` 字段；否则默认使用 `recycle-item` 对应的抽象节点渲染
- `isSectionFooter: true` 的数据建议放在对应分组的最后一行、下一个 `isSectionHeader: true` 数据之前，用于表示当前分组的尾部。
