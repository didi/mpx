---
name: changelog-generator
description: 通过查看当前最新版本与上一版本间的git提交记录与代码变更，生成版本变更日志，当用户询问“创建/生成变更日志”、“创建/生成changelog”时使用。
---

# 创建版本变更日志

通过当前最新版本与上一版本间的**git提交记录**（查看两个版本间的commits信息）和**代码变更**（查看两个版本间的代码diff），生成版本变更日志

## 内容结构

变更日志包括以下三项内容：

1. **New Features**：当前版本的新增功能与特性，按需可选生成
2. **Bug Fixes**：当前版本修复的bug，按需可选生成
3. **Packages**：当前版本涉及的 npm 包版本变更记录，必须按下述流程获取并补齐，不得留空。

严格遵循上述内容结构，不要私自添加其他内容，过于细碎的变更如变量重命名，实现微调等可以不用列出。

生成内容写入到 changelogs/<version>.md 文件中。

## Packages 信息获取

1. **确认版本范围**：确定上一发布 tag 与本次目标版本，结合 `lerna.json`、Git tag 和用户已确认的信息判断；不要将尚未升版的当前包版本误当作目标版本。
2. **已完成升版**：对比上一发布 tag 与本次发布提交（或已升版的工作区）中 `packages/*/package.json` 的 `name`、`version`，列出实际升级的非私有包。当前终端中本次 `lerna version` / 发布日志可辅助核对包清单。
3. **尚未升版**：在仓库根目录执行 `node_modules/.bin/lerna changed --json`，确认输出中的比较基准与上一发布 tag 一致。以返回的非私有包清单及当前 `package.json` 版本为依据，结合已确认的目标版本生成升级记录；本仓库采用统一版本模式。不要仅凭业务代码改动筛选包，也不要直接假定全部包都升级。向用户说明这是待发布的升级清单。
4. **校验并写入**：按包名排序，逐项写为 `- @mpxjs/<name>: <oldVersion> => <newVersion>`，检查包名、版本和数量与来源一致。新发布的包没有旧版本时写为 `- @mpxjs/<name>: 新增 => <newVersion>`。若已确认没有包版本变化，明确写“本次无 npm 包版本变更”。
5. **信息不足时继续定位**：命令不可用或结果与版本范围不符时，检查本地依赖、版本提交和发布日志；仍无法确定的具体信息向用户询问，不得以空章节或猜测清单作为完成结果。获取清单使用只读操作，不为生成 changelog 执行升版或发布命令。

## 文档与 Skill 同步约束

生成变更日志后，检查版本变更内容是否涉及**用户开发使用方式**（对外暴露的 API、配置项、模板/样式/脚本/JSON 能力、CLI 参数、生命周期、内建组件、环境 API、跨端行为差异等），如涉及则必须同步更新对应的文档与 Skill：

- **文档**：更新 [docs-vitepress/](../../../docs-vitepress/) 下对应位置的 `.md`，并按 [docs-vitepress/AGENTS.md](../../../docs-vitepress/AGENTS.md) 的归档原则与索引要求同步侧边栏、导航及目录索引。
- **Skill**：读取 [mpx Skill](../mpx/SKILL.md)，核对并补齐本版本涉及的用户开发使用方式。核心能力与通用用法归入 `mpx/references/base/`，支付宝、RN、Web、Skyline 的支持范围、差异与专属扩展分别归入 `mpx/references/ali/`、`mpx/references/rn/`、`mpx/references/web/`、`mpx/references/skyline/`；跨多个目标时同步核对实际受影响的参考与索引，已有内容准确覆盖时无需重复添加。
- 仅修改内部实现、重构、测试、构建脚本而不改变对外使用方式的变更项，无需更新文档或 Skill。

## 内容示例

```markdown
# v2.10.18

## ✨ New Features 
- **跨端输出 React Native**
  - Swiper 增强 : 支持 indicator-margin 、 indicator-width 和 height 属性，提升了轮播图组件的定制能力。
  - Input 增强 :
    - 新增支持 keyboard 属性，并将 keyboardType 自动映射为 RN 的 inputMode 。
    - 新增支持 hold-keyboard 属性。
  - 响应式布局优化 :
    - 优化 rpx 、 vh 、 vw 单位机制，支持在屏幕尺寸变化时自动刷新。
    - 所有 CSS 单位计算基准由 window 改为 screen。
    - onResize 触发时机与微信小程序保持一致。
    - 新增 rnConfig.customDimensionsInfo 配置，支持自定义修改基准尺寸信息。
  - 动画支持 : 新增对颜色插值和百分比动画的支持，增强了动画表现力。
  - 其他 : 增加对页面脚本错误的捕获和处理。
  
- **快手小程序**
  - 新增支持跨端输出快手小程序。

- **其他优化**
  - 优化 global.__formatValue 实现，提升数据处理效率。

## 🐛 Bug Fixes 
- **跨端输出 React Native**
  - 样式与渲染 :
    - 修复 CSS 变量使用非法 fallback 值导致的应用崩溃问题。
    - 修复 background-size 在处理百分比尺寸时的计算逻辑。
    - 修复 Textarea 开启 auto-height 后 min-height 失效的问题。
    - 修复样式块中单独 import CSS 文件时的报错。
   
  - 交互与事件 :
    - 修复 Android 平台多个输入框切换聚焦时的逻辑时序问题。
    - 修复 iOS 平台 Input 组件一些边界场景下未触发 bindfocus 事件的问题。
  - 构建与运行 :
    - 修复 Swiper 开启指示点时 key 重复导致的报错。
    - 修复异步分包加载时 global 变量未被正确处理的问题。
    - 修复 wx:elif 静态为 true 时的构建报错。
  
- **跨端输出 Web**
  - 修复页面下拉刷新与 position: fixed 同时存在时的渲染异常。

- **支付宝小程序**
  - 修复组件 setup context报错异常。

- **其他修复**
  - 修复 defineOptions 使用 ObjectMethod 语法时的构建报错。
  - 修复 getBLEDeviceCharacteristics 取值错误。
  - 修复 transform 属性排序不一致导致的动画闪烁问题。
  - 修复路由超时错误信息中缺失 type 与 url 的问题。

## 📦 Packages
- @mpxjs/api-proxy: 2.10.17 => 2.10.18
- @mpxjs/core: 2.10.17 => 2.10.18
- @mpxjs/fetch: 2.10.17 => 2.10.18
- @mpxjs/pinia: 2.10.17 => 2.10.18
- @mpxjs/store: 2.10.17 => 2.10.18
- @mpxjs/utils: 2.10.17 => 2.10.18
- @mpxjs/webpack-plugin: 2.10.17 => 2.10.18
```
