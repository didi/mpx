# 跨端输出 Web 模板能力参考

> **填充说明（待补充，删除本块后正式发布）**：本文件为骨架。Web 模板能力与小程序高度一致，填充时**重点标注差异项**（不支持 / 降级 / 行为不同），通用一致的能力可一句话带过，不必逐条复述。可参考 `mpx2rn/references/rn-template-reference.md` 的表格形态，但支持结论须按 Web 实际情况重写。

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

TODO：Mustache 插值、属性绑定在 Web 的支持（与小程序一致，简述）。

## 模板指令

TODO：`wx:if` / `wx:for` / `wx:model` / `wx:class` / `wx:style` / `wx:ref` 等在 Web 的支持情况。

## 事件处理

TODO：`bind` / `catch` / 捕获、事件对象、冒泡机制在 Web（DOM 事件）的对齐与差异；内联传参。

## Slot

TODO：默认 / 具名 / scoped slot 在 Web 的支持。

## 动态组件

TODO：`<component is>` 在 Web 的支持。

## WXML 模板

TODO：`<template name>` / `<import>` / `<include>` 在 Web 的支持（参见 solutions/web-template-support.md：仅支持 import，不支持 include；不支持 scoped slot 等）。

## i18n 国际化

TODO：`useI18n` / 翻译函数命名约束在 Web 的支持。

## 无障碍访问

TODO：aria 等无障碍属性在 Web 的支持。

## 基础组件

> **本节为重点**：逐个列出基础组件在 Web 的支持状态，尤其标注不支持 / 降级项。

TODO 表格（建议列：组件 | Web 支持 | 说明/降级方式）：

- 视图容器：`view` / `scroll-view` / `swiper` / `cover-view` / `movable-view` 等 —— TODO
- 基础内容：`text` / `icon` / `progress` / `rich-text` —— TODO
- 表单：`button` / `input` / `textarea` / `checkbox` / `radio` / `picker` / `slider` / `switch` / `form` / `label` —— TODO
- 导航：`navigator` —— TODO
- 媒体：`image` / `video` / `audio` / `camera` / `live-player` / `live-pusher` —— **重点标注硬件/直播类在 Web 的不支持或降级**
- 地图 / 画布：`map`（Web 需 key/降级）/ `canvas` —— TODO
- 开放能力：`web-view`（Web 渲染为 iframe）/ `open-data` / `official-account` / `ad` —— **小程序开放能力类在 Web 多不支持**
