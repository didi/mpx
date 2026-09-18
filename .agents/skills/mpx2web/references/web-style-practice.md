# Mpx2Web 样式实践

本文档只记录 Web-only 样式差异。通用 Mpx 样式规范、样式条件编译语法、通用动态样式写法均不在本文维护。

## 目录

- [rpx 转换与 viewport](#rpx-转换与-viewport)
- [选择器与基础标签转换](#选择器与基础标签转换)
- [组件样式隔离](#组件样式隔离)
- [小字号兼容](#小字号兼容)
- [CSS 变量](#css-变量)
- [内建滚动组件与 transform](#内建滚动组件与-transform)
- [浏览器页面滚动](#浏览器页面滚动)

---

## rpx 转换与 viewport

Web 输出下样式中的 `rpx` 默认会转换为视口单位，换算基准为 `750rpx = 100vw`。

构建配置中的 `pluginOptions.mpx.plugin.webConfig.transRpxFn` 可自定义 Web 输出的 `rpx` 转换规则，例如转为 `rem` 或其它单位。

```js
// mpx.config.js（Mpx CLI Service）
module.exports = {
  pluginOptions: {
    mpx: {
      plugin: {
        webConfig: {
          transRpxFn: function (match, value) {
            if (value === '0') return value
            return `${value * 0.01}rem`
          }
        }
      }
    }
  }
}
```

移动端 Web 页面需要在 HTML 模板中配置正确的 viewport；Mpx 样式文件本身不负责注入 viewport。

---

## 选择器与基础标签转换

Web 编译会把 `view`、`image` 等小程序基础标签转换为原生标签或 `mpx-*` 内建 Vue 组件，源模板标签名不保证保留到最终 DOM。业务样式不要依赖基础标签选择器或在类选择器下嵌套基础标签选择器，应给目标节点添加稳定类名。

```html
<view class="card">
  <image class="card-image" src="xxx" />
</view>
```

```css
.card-image {
  width: 50px;
  height: 50px;
}
```

不要使用 `.card image { ... }` 推断转换后的节点结构。类选择器还能避免自定义 Web 内建组件或编译映射变化导致样式失效。

---

## 组件样式隔离

Web 默认使用普通 CSS 级联，不会自动复刻微信小程序的组件样式隔离。需要隔离组件样式时，在样式块添加 `scoped`：

```html
<style lang="stylus" scoped>
.card
  color #333
</style>
```

也可以通过 Mpx 编译配置 `autoScopeRules` 按 `include` / `exclude` 批量启用作用域。选择哪种方式取决于项目是否需要统一隔离；不要把支付宝或小程序运行时的 `styleIsolation` 字段直接当作 Web 的隔离实现。

---

## 小字号兼容

Mpx2Web 没有统一的 `12px` 最小字号限制，标准浏览器通常可以渲染 `10px` 等更小字号。部分目标浏览器、WebView、系统字体设置或文本自动调整策略可能把小字号钳制或放大；只有在目标环境实测存在该问题时，才使用较大基础字号配合 `transform: scale()`。不要把环境兼容现象写成所有 Web 输出都成立的框架限制。

CSS transform 只改变绘制结果，不会同步缩小原始排版盒。使用缩放方案时，按实际字形、缩放比例和对齐需求设置原点，必要时补偿占位，并在目标 WebView 检查间距和基线；不要从字号直接推导固定文本宽度或复制固定负边距。

---

## CSS 变量

Web 支持 `var(--name)`。变量未定义且没有回退值时不会抛出 JavaScript 异常，但该声明在计算值阶段无效；只有业务要求固定默认外观时才写 `var(--name, fallback)`。不要把所有 CSS 变量改成固定值，也不要把 `:hover`、安全区或其它标准 CSS 仅按关键词判为 Web-only；只有确认依赖浏览器专属能力时才做平台隔离。

---

## 内建滚动组件与 transform

Web 的 `movable-view` 和 `scroll-view` 通常通过 `transform` 实现移动或滚动，可能使内部 `position: fixed` 不再相对浏览器视口定位。

- 视口悬浮入口保留 `fixed`，不要直接改成 `absolute`。确受祖先 `transform` 影响时再调整结构；移出节点前确认不破坏数据作用域、样式、事件及滚动定位，修改后验证两端效果。
- `movable-view` 出现硬件合成相关展示异常时，可设置 `scroll-options` 中的 `HWCompositing: false`；它不保证移除所有 `transform` 或恢复 fixed 定位。
- 不默认替换 `scroll-view`。确需原生滚动时才考虑 `view` 配合 Web CSS `overflow`，并[保留原有滚动能力](./web-hybrid-dev.md#替换-scroll-view-时的契约核对)。
- 组件位于 `scroll-view` 内或存在多层组件嵌套，本身不能证明需要 `virtualHost`。先检查 Web 编译后的 DOM、宿主节点样式或可复现现象，确认某个宿主节点实际造成滚动、flex 直接子项或样式关系异常。
- 宿主节点的显示类型不合适时，优先按实际布局设置 `block` / `flex`。只有确需移除该节点且组件满足单根及运行时支持条件时，才通过 `autoVirtualHostRules` 启用 `virtualHost`。
- `autoVirtualHostRules` 只精确匹配已确认产生问题的组件。不要因为一个组件需要虚拟宿主，就连带加入它的父组件、子组件、同级组件或整条滚动内容链。
- flex 场景只处理宿主节点中断“容器—布局子项”关系的那个组件。例如父容器直接使用 `<layout-cell />` 时，只需评估 `layout-cell.mpx`；嵌套列表组件需要独立证据才能加入规则。

关闭 `movable-view` 硬件合成的配置示例：

```html
<movable-view scroll-options="{{ {HWCompositing: false} }}">
  <view class="fixed-content" />
</movable-view>
```

---

## 浏览器页面滚动

Web 页面默认滚动最终由浏览器页面容器承载。遇到 Web-only 的滚动问题时，重点排查 `html`、`body`、应用挂载节点之间的高度与 `overflow` 关系，以及弹层打开后的页面滚动穿透。

`scroll-view`、`disableScroll`、`position: fixed` 等小程序侧也支持的通用能力不在本文重复说明。
