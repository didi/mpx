# 跨端输出 Web 模板能力参考

本文档只记录 Mpx 输出 Web 时模板层需要特别判断的能力。常规小程序模板语法在 Web 下通常无需改写。

## 目录

- [数据绑定](#数据绑定)
- [模板指令](#模板指令)
- [事件处理](#事件处理)
- [Slot](#slot)
- [动态组件](#动态组件)
- [WXML 模板](#wxml-模板)
- [i18n 国际化](#i18n-国际化)
- [无障碍访问](#无障碍访问)
- [基础组件](#基础组件)

---

## 数据绑定

Mustache 插值、属性绑定、三元表达式、逻辑表达式、可选链、`__mpx_mode__` / `__mpx_env__` / `defs` 变量在 Web 下支持。

模板中不要直接调用普通 methods；需要加工展示数据时使用 `computed` 或 `wxs`。i18n 翻译函数可按 i18n 约束使用。

## 模板指令

| 指令 | Web 支持 | 说明 |
| --- | --- | --- |
| `wx:if` / `wx:elif` / `wx:else` | 支持 | 条件渲染。 |
| `wx:show` | 支持 | 显示隐藏。 |
| `wx:for` / `wx:for-item` / `wx:for-index` | 支持 | 列表渲染。 |
| `wx:key` | 支持 | 建议列表稳定使用。 |
| `wx:class` | 支持 | 推荐用于动态 class。 |
| `wx:style` | 支持 | 推荐用于动态 style。 |
| `wx:model` 及 `wx:model-*` | 支持 | 可用于基础组件和自定义组件。 |
| `wx:ref` | 支持 | 可获取基础组件节点或自定义组件实例。 |

动态 `class` / `style` 不要在字符串里拼接 `{{}}`，优先使用 `wx:class` / `wx:style`。

## 事件处理

Web 支持小程序事件绑定语法：`bind`、`catch`、`capture-bind`、`capture-catch`，支持事件冒泡、捕获和内联传参。

常用事件字段 `type`、`detail`、`target`、`currentTarget`、`timeStamp` 可用。依赖小程序原生事件额外字段时按具体组件判断。

## Slot

默认插槽、具名插槽支持。自定义组件多插槽按小程序写法使用。

## 动态组件

`<component is="...">` 支持。目标组件需在 JSON `usingComponents`、全局组件或抽象节点配置中可解析。

抽象节点在 Web 下支持，配置见 [JSON 配置参考](./web-json-reference.md)。

## WXML 模板

| 写法 | Web 支持 | 说明 |
| --- | --- | --- |
| `<template name="...">` | 支持 | 可定义可复用模板。 |
| `<template is="..." data="{{...}}">` | 支持 | `is` 目标需能在本文件或 import 中找到。 |
| `<import src="...">` | 支持 | 可引入外部模板定义。 |
| `<include src="...">` | 不支持 | 改用 `import + template is` 或组件。 |

Web 模板定义需要单根节点，多根模板定义会编译报错。

## i18n 国际化

模板内支持项目 i18n 翻译函数。组合式 API 中使用 `useI18n()` 时，返回给模板的函数名保持 `t` / `tc` / `te` / `tm`，不要重命名。

## 无障碍访问

`aria-*`、`role`、`tabindex` 等 Web 无障碍属性可用。

小程序专属无障碍字段不要假定在 Web 有相同语义；需要 Web 无障碍时直接使用 Web 标准属性，并按跨端条件隔离小程序不接受的写法。

## 基础组件

### 支持组件

以下组件在 Web 下可按小程序写法优先使用。

| 类型 | 组件 | Web 行为 |
| --- | --- | --- |
| 视图容器 | `view`、`cover-view` | 常规展示可用；`cover-view` 不具备小程序原生覆盖层语义。 |
| 滚动 | `scroll-view` | 支持滚动、下拉刷新相关能力。 |
| 轮播 | `swiper`、`swiper-item` | 支持。 |
| 拖拽 | `movable-area`、`movable-view` | 支持。 |
| 基础内容 | `text`、`cover-image`、`image`、`icon`、`progress`、`rich-text` | 支持。 |
| 表单 | `button`、`input`、`textarea`、`checkbox`、`checkbox-group`、`radio`、`radio-group`、`picker`、`picker-view`、`picker-view-column`、`slider`、`switch`、`form`、`label` | 支持；键盘、输入类型、表单提交等按浏览器能力降级。 |
| 导航 | `navigator` | 支持；`open-type` 仅支持 Web 可实现的导航语义。 |
| 媒体 | `video` | 支持；投屏、小程序广告、原生画中画等小程序宿主能力不可依赖。 |
| Web 容器 | `web-view` | 以 Web 页面容器承载目标地址；域名白名单、postMessage 和导航桥接按 Web 能力工作。 |
| 扩展组件 | `sticky-section`、`sticky-header` | 支持。 |

### 没有 Web 小程序能力的组件

| 组件 | Web 结论 | 建议 |
| --- | --- | --- |
| `camera` | Web 没有小程序相机组件能力。 | 使用浏览器媒体能力或业务 H5 SDK，并用条件编译隔离。 |
| `live-player` / `live-pusher` | Web 没有小程序直播组件能力。 | 使用 H5 播放/推流方案，并用条件编译隔离。 |
| `open-data` | Web 没有小程序开放数据能力。 | 改为业务接口或 Web 用户体系。 |
| `official-account` | Web 没有小程序公众号关注组件能力。 | 改为 Web 侧业务入口。 |
| `ad` / `ad-custom` | Web 没有小程序广告组件能力。 | 使用 Web 广告 SDK，并用条件编译隔离。 |
| `functional-page-navigator` | Web 没有小程序功能页能力。 | 使用 Web 页面或业务流程替代。 |
| `editor` | Web 没有对应内置组件。 | 使用 Web 富文本编辑器，并用条件编译隔离。 |
| `map` | Web 没有小程序地图组件能力。 | 使用 Web 地图 SDK 或业务地图组件。 |
| `audio` | Web 没有小程序 `audio` 组件能力。 | 使用原生 `<audio>` 或业务音频组件。 |

### 特殊说明

- `canvas` 在 Web 下可作为原生 `<canvas>` 使用，但不等同于小程序 Canvas 组件完整能力；小程序 Canvas API 迁移需结合 Web Canvas API 或业务封装处理。
- `cover-view` 在 Web 不具备小程序原生覆盖层语义，按普通展示容器处理。
- `customBuiltInComponents` 可接入业务自定义组件，具体能力以业务实现为准。
