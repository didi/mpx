---
name: changelog-generator
description: 通过查看当前最新版本与上一版本间的git提交记录与代码变更，生成版本变更日志，当用户询问“创建/生成变更日志”、“创建/生成changelog”时使用。
---

# 创建版本变更日志

通过当前最新版本与上一版本间的**git提交记录**（查看两个版本间的commits信息）和**代码变更**（查看两个版本间的代码差异），生成版本变更日志

## 内容结构

变更日志包括以下三项内容：

1. **New Features**：当前版本的新增功能与特性，按需可选生成
2. **Bug Fixes**：当前版本修复的bug，按需可选生成
3. **Packages**：当前版本涉及的npm包版本变更记录，通常可以从当前活跃终端的日志信息中查询到，如无法获取到准确信息可以留空

严格遵循上述内容结构，不要私自添加其他内容，过于细碎的变更如变量重命名，实现微调等可以不用列出。

生成内容写入到 CHANGELOG.md 文件中。

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
