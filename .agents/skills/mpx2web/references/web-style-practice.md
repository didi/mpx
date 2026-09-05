# Mpx2Web 样式实践

本文档只记录 Web-only 样式差异。通用 Mpx 样式规范、样式条件编译语法、通用动态样式写法均不在本文维护。

## 目录

- [rpx 转换与 viewport](#rpx-转换与-viewport)
- [选择器与基础标签转换](#选择器与基础标签转换)
- [组件样式隔离](#组件样式隔离)
- [CSS 变量回退值](#css-变量回退值)
- [小字号兼容](#小字号兼容)
- [Web-only CSS](#web-only-css)
- [内建滚动组件与 transform](#内建滚动组件与-transform)
- [浏览器页面滚动](#浏览器页面滚动)

---

## rpx 转换与 viewport

Web 输出下样式中的 `rpx` 默认会转换为视口单位，换算基准为 `750rpx = 100vw`。

`webConfig.transRpxFn` 可自定义 Web 输出的 `rpx` 转换规则，例如转为 `rem` 或其它单位。

```js
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

## CSS 变量回退值

Web 原生支持 CSS 变量，但变量未定义且 `var()` 没有回退值时，所在 CSS 声明会在计算值阶段失效。跨组件主题变量应提供合理默认值，避免宿主未注入变量时样式丢失：

```css
.button {
  background: var(--btn-wrapper-bg, #2a2f3f);
}
```

这属于稳健性要求，不表示浏览器禁止使用无回退值的 CSS 变量；能够保证变量始终定义时可以不设置回退值。

---

## 小字号兼容

Mpx2Web 没有统一的 `12px` 最小字号限制，标准浏览器通常可以渲染 `10px` 等更小字号。部分目标浏览器、WebView、系统字体设置或文本自动调整策略可能把小字号钳制或放大；只有在目标环境实测存在该问题时，才使用较大基础字号配合 `transform: scale()`。不要把环境兼容现象写成所有 Web 输出都成立的框架限制。

CSS transform 只改变绘制结果，不会缩小 flex/inline 布局中的原始排版盒。若把 `12px` 文本缩放到视觉上的 `10px`，仍按 `12px` 盒子占位会改变价格行间距、卡片有效宽度或基线。兼容方案必须同时满足：

- `transform-origin` 与排版方向一致；左到右文本通常使用左侧与基线方向的原点，例如 `left bottom`，不要无依据使用中心缩放。
- 用包裹层的明确视觉宽度、匹配的 `width`/`flex-basis`，或按缩放差值计算的负尾边距补偿占位。补偿值应由基础字号、缩放比例和实际字形/设计宽度推导，不要复制固定像素。
- 在真实 WebView 验证父级卡片宽度、相邻金额间距和整行 baseline；只出现 `scale()` 与 `transform-origin` 不能证明布局已对齐。

下面仅展示“12px 排版盒缩到 10px，并把多出的 2px 占位收回”的结构，实际宽度应按业务字形测量：

```css
.small-text {
  display: inline-block;
  width: 12px;
  font-size: 12px;
  transform: scale(0.833333);
  transform-origin: left bottom;
  margin-inline-end: -2px;
}
```

---

## Web-only CSS

以下能力属于 Web-only 样式增强，适合隔离在 Web 输出中：

| 能力 | Web 侧用途 |
| --- | --- |
| `::-webkit-scrollbar` 等浏览器私有伪元素 | 自定义滚动条。 |
| `:hover` 等鼠标交互伪类 | 桌面 Web 悬停态。 |
| 浏览器厂商私有属性或伪元素 | 处理浏览器特有展示与兼容差异。 |

只在确认能力依赖浏览器 CSS 引擎、且小程序侧不需要该效果时，才将其作为 Web-only 样式隔离。小程序已支持的标准 CSS 能力属于通用样式，不在本文重复记录。

隔离检查要覆盖文件中的每一次出现：即使 `:hover` 和 `::-webkit-scrollbar` 已放进 `<style mode="web">`，通用 style 块中遗留的 `env(safe-area-inset-*)`、厂商私有选择器或属性仍会进入小程序输出。整块均为浏览器增强时使用 `<style mode="web">`；局部增强时使用完整配对的 Web 样式条件注释，不要只在文件末尾增加一份 Web 覆盖而保留前面的未隔离声明。

---

## 内建滚动组件与 transform

Web 的 `movable-view` 和 `scroll-view` 基于 BetterScroll，滚动或移动内容通常通过 `transform` 实现。`transform` 会创建新的 containing block 和 stacking context，Safari 等浏览器下可能影响后代 `position: fixed`、层叠与合成渲染；例如 `movable-view` 内的 fixed 节点可能改为相对该变换节点定位。

如果常驻入口已经是 `scroll-view` 的兄弟节点，或位于其他变换子树之外，应继续使用 `position: fixed` 保持相对浏览器视口定位；不要仅因 Web 使用 BetterScroll 就把它改成相对页面容器的 `position: absolute`。只有 fixed 节点确实必须留在变换子树中时，才需要移动节点，或改用 Web-only 的浏览器原生滚动方案。

`movable-view` 可通过 `scroll-options` 覆盖 BetterScroll 初始化配置；遇到硬件合成导致的展示问题时，可以关闭 `HWCompositing`：

```html
<movable-view scroll-options="{{ {HWCompositing: false} }}">
  <view class="fixed-content" />
</movable-view>
```

`scroll-view` 的 Web 滚动实现仍依赖 transform。若 fixed 节点确实必须留在滚动内容中，且业务必须保留浏览器原生的 fixed 定位、层叠或滚动语义，可使用普通 `view` 配合 Web CSS `overflow` 实现原生滚动，并通过 Web-only 组件或条件编译隔离差异。

避免在 `scroll-view` 内容中连续引入多层 `display: initial` 的非虚拟组件根节点；这会保留额外包装层并可能干扰 BetterScroll 的内容尺寸和滑动计算。优先明确设置与布局匹配的 `block` / `flex`，或在确认模板满足单根约束后按组件能力启用 `virtualHost`，并在真实 Web 构建中验证滚动。

---

## 浏览器页面滚动

Web 页面默认滚动最终由浏览器页面容器承载。遇到 Web-only 的滚动问题时，重点排查 `html`、`body`、应用挂载节点之间的高度与 `overflow` 关系，以及弹层打开后的页面滚动穿透。

`scroll-view`、`disableScroll`、`position: fixed` 等小程序侧也支持的通用能力不在本文重复说明。
