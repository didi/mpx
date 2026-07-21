# Mpx2Web 样式实践

本文档只记录 Web-only 样式差异。通用 Mpx 样式规范、样式条件编译语法、通用动态样式写法均不在本文维护。

## 目录

- [rpx 转换与 viewport](#rpx-转换与-viewport)
- [Web-only CSS](#web-only-css)
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

## Web-only CSS

以下能力属于 Web-only 样式增强，适合隔离在 Web 输出中：

| 能力 | Web 侧用途 |
| --- | --- |
| `::-webkit-scrollbar` 等浏览器私有伪元素 | 自定义滚动条。 |
| `:hover` 等鼠标交互伪类 | 桌面 Web 悬停态。 |
| 浏览器厂商私有属性或伪元素 | 处理浏览器特有展示与兼容差异。 |

只在确认能力依赖浏览器 CSS 引擎、且小程序侧不需要该效果时，才将其作为 Web-only 样式隔离。小程序已支持的标准 CSS 能力属于通用样式，不在本文重复记录。

---

## 浏览器页面滚动

Web 页面默认滚动最终由浏览器页面容器承载。遇到 Web-only 的滚动问题时，重点排查 `html`、`body`、应用挂载节点之间的高度与 `overflow` 关系，以及弹层打开后的页面滚动穿透。

`scroll-view`、`disableScroll`、`position: fixed` 等小程序侧也支持的通用能力不在本文重复说明。
