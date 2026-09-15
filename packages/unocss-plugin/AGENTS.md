# @mpxjs/unocss-plugin

Mpx 与 UnoCSS 的集成插件：在小程序构建中扫描 wxml/mpx 模板提取 class，生成 unocss 样式注入产物；在 Web 端封装 `@unocss/webpack` 适配 Mpx 的 SFC 流水线。

## 入口文件

- [lib/index.js](lib/index.js)：导出 `MpxUnocssPlugin`（小程序 webpack 插件主体），同时根据目标 mode 决定是否切换到 Web 子插件。
- [lib/web-plugin/index.js](lib/web-plugin/index.js)：Web 端插件入口（封装 UnoCSS 官方 webpack plugin 与 transform-loader）。

## 核心模块

- [lib/index.js](lib/index.js)：
  - 装配 unocss generator（基于 `@unocss/core` + `@unocss/config`）。
  - 通过 `MpxWebpackPlugin` 钩子在小程序产物 emit 阶段扫描 wxml 资产，调用 [parser.js](lib/parser.js) 提取 class，生成新增的 wxss 资产。
  - 集成 `transformerDirectives` / `transformerVariantGroup`，在样式 transform 阶段调用 [transform.js](lib/transform.js)。
- [lib/parser.js](lib/parser.js)：`parseClasses` / `parseStrings` / `parseMustache` / `stringifyAttr` / `parseComments` / `parseCommentConfig`，从模板/字符串/注释中提取 class 与配置。
- [lib/transform.js](lib/transform.js)：`transformStyle` / `buildAliasTransformer` / `transformGroups` / `mpEscape` / `cssRequiresTransform`，处理 unocss → 小程序 wxss 的转义（class 名转义、伪类、组合器等）。
- [lib/source.js](lib/source.js)：`getReplaceSource` / `getConcatSource` / `getRawSource`，统一封装 webpack `Source` 对象的创建。
- [lib/platform.js](lib/platform.js)：各小程序平台的 preflights / 选择器映射表（被主插件按 `mpx_mode` 取用）。
- [lib/web-plugin/](lib/web-plugin/)：Web 端实现。
  - [index.js](lib/web-plugin/index.js)：插件主体。
  - [transform-loader.js](lib/web-plugin/transform-loader.js)：transform 阶段 loader。
  - [consts.js](lib/web-plugin/consts.js) / [utils.js](lib/web-plugin/utils.js)。

## 典型调用链

1. **小程序模式**：`new MpxUnocssPlugin(opts)` → [index.js](lib/index.js) `apply(compiler)` → 监听 `MpxWebpackPlugin` 暴露的钩子 → 在 emit 前枚举 wxml 资产 → [parser.js](lib/parser.js) 提取 class → unocss generator 产出 css → [transform.js](lib/transform.js) 适配小程序选择器与转义 → [source.js](lib/source.js) 写入新 wxss 资产，必要时合并到现有样式文件。
2. **Web 模式**：当目标是 Web 时，主插件转发到 [lib/web-plugin/index.js](lib/web-plugin/index.js) → 注册官方 `@unocss/webpack` 与 [transform-loader.js](lib/web-plugin/transform-loader.js)，对 Mpx SFC 的 `<template>` / `<style>` 做 unocss transform。
3. **scan 过滤**：通过 `opts.scan.include/exclude`（minimatch）筛选要处理的资产。

## 注意

- 大量复用 [@mpxjs/webpack-plugin](../webpack-plugin/AGENTS.md) 的 utils（`to-posix`、`fix-relative`、`parse-request`、`match-condition` 等），跨包升级时保持版本对齐。
- 小程序选择器有限制（`>` / `*` / 复杂伪类支持差异大），新增 transform 规则前先确认目标平台支持度，规则放进 [transform.js](lib/transform.js) / [platform.js](lib/platform.js)。
