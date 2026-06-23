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
| 复合选择器、伪类、伪元素、媒体查询 | Web 支持；若小程序侧不支持，需条件编译隔离。 |
| `grid`、`float`、`position: sticky`、CSS 变量、`calc()` | Web 支持；跨端公共样式中按目标小程序支持情况判断是否隔离。 |
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

Web 支持的 CSS 比小程序更多。以下写法可用于 Web，但放进跨端公共样式前要确认小程序目标端是否支持。

| 能力 | 建议 |
| --- | --- |
| `::-webkit-scrollbar` 等浏览器私有伪元素 | Web 专属，通常需要条件编译。 |
| `:hover` 等鼠标交互伪类 | Web 支持；移动端和小程序侧按实际交互降级。 |
| CSS 变量 | Web 支持；小程序目标端不确定时隔离或提供 fallback。 |
| `position: sticky` | Web 支持；小程序侧需确认是否有等效。 |
| `backdrop-filter`、高级滤镜等 | Web 支持度与浏览器有关，跨端公共样式中谨慎使用。 |

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

如果同一份样式还要输出小程序端，确认目标小程序对 `env()` 的支持情况；不确定时用条件编译分平台处理。

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

Web 高分屏细线可用 `0.5px`、伪元素缩放或业务通用 mixin 实现。跨端公共样式中优先复用项目已有方案，不要为了 Web 单独替换小程序侧稳定写法。

```css
.hairline {
  border-bottom: 1px solid #e5e5e5;
}

/* @mpx-if (__mpx_mode__ === 'web') */
@media (min-resolution: 2dppx) {
  .hairline {
    border-bottom-width: 0.5px;
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
