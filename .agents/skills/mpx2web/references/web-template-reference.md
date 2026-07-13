# Mpx2Web 模板差异参考

本文档只记录 Web-only 模板差异。数据绑定、通用模板指令、事件语法、slot、i18n、动态样式类名、节点访问等基础能力当前先参考 `../mpx2rn` 公共部分，未来替换为 mpx base skill。

## 目录

- [Web 原生标签](#web-原生标签)
- [Web 标准属性](#web-标准属性)
- [Web 组件降级](#web-组件降级)
- [Web 容器](#web-容器)

---

## Web 原生标签

Web 输出可使用 HTML / SVG 原生标签承载 Web-only 能力，例如 `<canvas>`、`<svg>`、`<audio>`、`<video>` 或业务 H5 容器节点。原生标签属于 Web-only 内容时，应与通用模板隔离，避免通用构建解析到浏览器专属节点。

```html
<template>
  <view class="chart-card">
    <canvas class="chart-canvas"></canvas>
    <svg class="chart-icon" viewBox="0 0 16 16">
      <circle cx="8" cy="8" r="6"></circle>
    </svg>
  </view>
</template>
```

节点访问方式不在本文展开，当前先参考 `../mpx2rn` 公共部分中的通用节点访问说明，未来替换为 mpx base skill。

---

## Web 标准属性

`aria-*`、`role`、`tabindex` 等 Web 标准无障碍属性可用于 Web-only 模板。需要做键盘导航、读屏语义或桌面 Web 可访问性时，按 Web 标准设计。

---

## Web 组件降级

以下能力在 Web 下没有浏览器等价组件，需要 Web 方案替代：

| 组件 | Web 侧处理 |
| --- | --- |
| `camera` | 使用浏览器媒体能力或业务 H5 SDK。 |
| `live-player` / `live-pusher` | 使用 H5 播放 / 推流方案。 |
| `open-data` | 改为业务接口或 Web 用户体系。 |
| `official-account` | 改为 Web 侧业务入口。 |
| `ad` / `ad-custom` | 使用 Web 广告 SDK。 |
| `functional-page-navigator` | 使用 Web 页面或业务流程替代。 |
| `editor` | 使用 Web 富文本编辑器。 |
| `map` | 使用 Web 地图 SDK 或业务地图组件。 |

`canvas` 在 Web 下可作为原生 `<canvas>` 使用；复杂场景应结合 Web Canvas API 或业务封装处理。

---

## Web 容器

`web-view` 在 Web 下以页面容器承载目标地址；域名白名单、postMessage 和导航桥接按 Web 能力工作。涉及嵌入页通信时，应同时检查 Web 安全策略、白名单、跨域与回调域名。
