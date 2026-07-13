# Mpx2Web 样式实践

本文档只记录 Web-only 样式差异。通用 Mpx 样式规范、样式条件编译语法、通用动态样式写法均不在本文维护。

## 目录

- [单位与适配](#单位与适配)
- [Web-only CSS](#web-only-css)
- [安全区域](#安全区域)
- [固定定位与滚动](#固定定位与滚动)
- [细线增强](#细线增强)

---

## 单位与适配

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

Web 原生单位 `rem`、`em`、`vw`、`vh`、`vmin`、`vmax` 可用于 Web-only 样式。移动端 Web 页面还需要 HTML 模板配置正确的 viewport；Mpx 样式文件本身不负责注入 viewport。

---

## Web-only CSS

以下能力属于 Web-only 样式增强，适合隔离在 Web 输出中：

| 能力 | Web 侧用途 |
| --- | --- |
| `::-webkit-scrollbar` 等浏览器私有伪元素 | 自定义滚动条。 |
| `:hover` 等鼠标交互伪类 | 桌面 Web 悬停态。 |
| CSS 变量 | Web 主题变量、运行时主题切换。 |
| `position: sticky` | 浏览器原生吸顶。 |
| `backdrop-filter`、高级滤镜 | Web 视觉增强。 |

Web 基于真实 CSS 引擎，可直接使用浏览器支持的真实 CSS 能力。

---

## 安全区域

Web 可使用 `env(safe-area-inset-*)` 处理刘海屏和底部手势区域。

```css
.page {
  padding-bottom: env(safe-area-inset-bottom);
}
```

---

## 固定定位与滚动

Web 页面默认使用浏览器滚动。页面 JSON 中 `disableScroll` 会影响页面默认滚动。

| 场景 | Web 侧建议 |
| --- | --- |
| 页面整体滚动 | 优先使用页面默认滚动。 |
| 局部滚动 | 使用 `scroll-view` 或 Web 原生 `overflow`。 |
| `position: fixed` | Web 支持；复杂浮层注意浏览器层级与滚动穿透。 |
| 禁止页面滚动 | 页面 JSON 使用 `disableScroll: true`，由自定义滚动容器承接内容滚动。 |

---

## 细线增强

Web 高分屏细线可使用伪元素缩放或业务 Web mixin 增强，不建议依赖 `0.5px` 边框。

```css
.hairline {
  position: relative;
}

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
```
