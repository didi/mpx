# 跨端输出 Web 样式实践

本文档说明 Mpx 输出 Web 时样式层的少量差异与实践。Web 基于真实 CSS 引擎，CSS 能力通常比小程序更完整；不要按属性清单逐项判断 Web 是否支持，也不要为了 Web 兼容改写已有小程序样式。只有在使用 Web 专属 CSS、移动端适配或单位转换时才需要关注本文件。

## 目录

- [总体判断](#总体判断)
- [单位与适配](#单位与适配)
- [Web 专属 CSS](#web-专属-css)
- [安全区域](#安全区域)
- [固定定位与滚动](#固定定位与滚动)
- [1px 边框](#1px-边框)
- [公共样式](#公共样式)

---

## 总体判断

| 场景 | Web 侧说明 |
| --- | --- |
| 常规 CSS 属性 | Web 可直接使用，不需要为 Web 兼容改写。 |
| 复合选择器、伪类、伪元素、媒体查询 | Web 支持；小程序不支持的选择器需条件编译隔离。 |
| `grid`、`float`、`position: sticky`、CSS 变量、`calc()` | Web 支持；其中 `position: sticky`、CSS 变量不要作为跨小程序公共样式能力。 |
| `scoped` | Web 支持，编译阶段会添加 scope 标识。 |
| `lang` 预处理器 | 按工程 loader 配置支持 Less / Sass / Stylus 等。 |
| 动态样式 | 优先用 `wx:class` / `wx:style`，避免在 `class` / `style` 字符串里拼接 `{{}}`。 |

---

## 单位与适配

### rpx

Web 输出下样式中的 `rpx` 默认会转换为 `vw`，换算基准为 `750rpx = 100vw`。

```css
.box {
  width: 750rpx; /* Web 默认约等于 100vw */
}
```

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

### px 转 rpx 注释

如果工程使用 `transRpxRules`，保留原样式中的 `/* use rpx */` 与 `/* use px */` 注释。它们用于控制编译期是否把 `px` 转成 `rpx`，随后 Web 再按 `rpx` 规则转换。

| 注释 | 常见用途 |
| --- | --- |
| `/* use rpx */` | `mode: only` 下，仅标记的规则或声明参与 px 到 rpx 转换。 |
| `/* use px */` | `mode: all` 下，排除标记的规则或声明。 |

### Web 原生单位

`rem`、`em`、`vw`、`vh`、`vmin`、`vmax` 等 Web 原生单位可在 Web 使用。若同一份样式还要输出小程序端，优先使用 `rpx` / `px` 等跨端稳定单位；确需 Web 原生单位时用样式条件编译隔离。

---

## Web 专属 CSS

Web 支持的 CSS 比小程序更多。以下写法可用于 Web，但不要直接放进跨端公共样式。

小程序侧需按跨渲染引擎口径判断：Skyline 不支持或不稳定的 CSS 能力，即使 WebView 渲染下可能部分生效，也不要写入跨小程序公共样式。需要使用时用条件编译隔离到 Web，或只在已验证的单一小程序目标内使用。

| 能力 | 小程序结论 | 建议 |
| --- | --- | --- |
| `::-webkit-scrollbar` 等浏览器私有伪元素 | 小程序不可用。 | Web 专属，用样式条件编译隔离。 |
| `:hover` 等鼠标交互伪类 | 小程序不可用。 | Web 专属；小程序点击态用组件 `hover-class`。 |
| CSS 变量 | 不作为跨小程序公共能力。 | Web 可用；只在 Web 样式或已验证的单一小程序目标内使用。 |
| `position: sticky` | 不作为跨小程序公共能力。 | Web 可用；小程序侧需要吸顶时使用平台组件或业务实现。 |
| `backdrop-filter`、高级滤镜等 | 小程序不可用。 | Web 专属，用样式条件编译隔离。 |

样式条件编译示例：

```css
/* @mpx-if (__mpx_mode__ === 'web') */
.scrollbar::-webkit-scrollbar {
  width: 4px;
}
/* @mpx-endif */
```

---

## 安全区域

Web 可使用 `env(safe-area-inset-*)` 处理刘海屏和底部手势区域。

```css
.page {
  padding-bottom: env(safe-area-inset-bottom);
}
```

`env(safe-area-inset-*)` 在 Web 与部分小程序 WebView 场景可直接使用。若业务已在目标小程序验证可用，可以放在公共样式中；若还需覆盖 Skyline 或其他未验证容器，使用平台安全区 API 或业务注入变量做兜底。

---

## 固定定位与滚动

Web 页面默认使用浏览器滚动。页面级滚动生命周期由 Mpx Web 运行时处理，页面 JSON 中 `disableScroll` 会影响页面滚动。

| 场景 | 建议 |
| --- | --- |
| 页面整体滚动 | 优先使用页面默认滚动，配合 `onPageScroll` / `onReachBottom`。 |
| 局部滚动 | 使用 `scroll-view` 或 Web 原生 `overflow`，注意小程序端滚动容器差异。 |
| `position: fixed` | Web 支持；小程序端固定定位表现与层级可能不同，复杂场景需分端确认。 |
| 禁止页面滚动 | 页面 JSON 使用 `disableScroll: true`，自定义滚动容器承接内容滚动。 |

---

## 1px 边框

Web 高分屏细线不要依赖 `0.5px` 边框，优先使用伪元素缩放或业务通用 mixin。跨端公共样式中保留小程序侧稳定写法，Web 需要更细的视觉效果时用条件编译增强。

```css
.hairline {
  position: relative;
}

/* @mpx-if (__mpx_mode__ === 'web') */
.hairline::after {
  content: '';
  position: absolute;
  left: 0;
  top: 0;
  width: 100%;
  height: 100%;
  border: 1px solid #e5e5e5;
  pointer-events: none;
}

@media (-webkit-min-device-pixel-ratio: 2), (min-resolution: 2dppx) {
  .hairline::after {
    width: 200%;
    height: 200%;
    transform: scale(0.5);
    transform-origin: 0 0;
  }
}

@media (-webkit-min-device-pixel-ratio: 3), (min-resolution: 3dppx) {
  .hairline::after {
    width: 300%;
    height: 300%;
    transform: scale(0.333333);
    transform-origin: 0 0;
  }
}
/* @mpx-endif */
```

---

## 公共样式

- 跨端公共样式优先使用小程序与 Web 都稳定支持的写法。
- Web 专属增强样式用条件编译最小包裹，不要整段样式大面积分叉。
- 保留 `/* use rpx */` / `/* use px */` 注释，避免破坏工程单位转换规则。
- 移动端 Web 页面需保证 HTML 模板配置正确的 viewport；Mpx 样式文件本身不负责注入 viewport。
