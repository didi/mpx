# Mpx 扩展组件

除基础组件外，Mpx 额外提供一些扩展组件。扩展组件需开发者在 `mpx.config.js`中通过编译配置`useExtendComponents`按需注册，注册成功后即可作为全局自定义组件使用。
```js
// mpx.config.js
defineConfig({
  pluginOptions: {
    mpx: {
      plugin: {
        useExtendComponents: {
          wx: ["recycle-view"],
          ali: ["recycle-view"],
          web: ["recycle-view"],
          ios: ["recycle-view"],
          android: ["recycle-view"],
          harmony: ["recycle-view"]
        }
      }
    }
  }
})
```


## recycle-view 

跨端虚拟列表组件，可自定义分组头、列表头、列表项，自动分段渲染兼容各端。

支持平台：微信小程序、支付宝小程序、Web、RN

### 属性

| 属性名                  | 类型         | 默认值   | 说明                   | 支持平台  |
|-----------------------|-------------|----------|------------------------|-----------|
| height                | String/Number | 100%    | 组件高度                | 全平台    |
| width                 | String/Number | 100%    | 组件宽度                | 全平台    |
| listData              | Array       | []       | 列表数据，含分组结构    | 全平台    |
| enable-sticky          | Boolean     | false    | 启用分组吸顶            | 全平台<br>⚠️在微信小程序环境，需要使用 skyline 渲染模式，webview 模式不支持    |
| scroll-with-animation   | Boolean     | false    | 滚动动画                | 全平台    |
| generic:recycle-item         | string      |       | 列表项，抽象节点组件名，对应组件需要通过 usingComponents 注册               | 全平台  |
| generic:section-header    | string      |       | 列表分组头，抽象节点组件名，对应组件需要通过 usingComponents 注册          | 全平台  |
| generic:list-header     | string      |       | 列表头，抽象节点组件名，对应组件需要通过 usingComponents 注册       | 全平台  |
| useListHeader         | Boolean     | false     | 使用自定义列表头        | 全平台    |
| listHeaderData        | Object      | {}       | 列表头数据              | 全平台    |
| itemHeight            | Object      | {}       | 列表项高度配置（支持 getter/value），必须配置    | 全平台      |
| sectionHeaderHeight   | Object      | {}       | 分组头部高度配置（getter/value），若使用了自定义分组头必须配置      | 全平台      |
| listHeaderHeight      | Object      | {}       | 列表头部高度配置（getter/value），若使用了列表头必须配置      | 全平台      |
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
| bindscroll                | 滚动时触发，返回滚动信息            | 全平台       |
| bindscrolltolower         | 滚动到底部/触底通知                 | 全平台       |
| bindscrollToIndex         | 组件方法，滚动到指定索引             | 全平台       |

`scrollToIndex({ index, animated, viewPosition })` 参数说明：
- `index`：目标索引
- `animated`：是否滚动动画
- `viewPosition`：滚动定位，0:顶部, 0.5:中间, 1:底部

### 用法示例

```js
<recycle-view
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
- 在 RN 环境，recycle-view 通过 RN 提供的 SectionList 实现分组吸顶。受 RN 底层实现机制限制，开启 `enable-sticky` 且快速滑动时，自定义分组头有时会出现闪烁现象。此问题需要等待 RN 官方修复，我们会持续关注并跟进。
- 若某行需要使用 `section-header` 对应的抽象节点渲染，则该行数据必须包含 `isSectionHeader: true` 字段；否则默认使用 `recycle-item` 对应的抽象节点渲染

