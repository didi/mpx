# 支付宝配置差异

本页维护支付宝编译选项与开发者工具配置。插件接入、规则匹配与运行时初始化沿用 [配置基准](../base/config-reference.md)；页面导航栏、回弹与滚动配置见 [JSON 差异](./ali-json-reference.md)。没有专项差异的运行时配置不重复列出。

适用范围见 [支付宝入口](./index.md#适用范围)。

## 目录

- [编译配置](#编译配置)
  - [目标与源码](#目标与源码)
  - [模板与样式配置](#模板与样式配置)
- [开发者工具配置](#开发者工具配置)
  - [启用 component2](#启用-component2)

## 编译配置

### 目标与源码

微信语法输出支付宝须显式设置 `mode: 'ali'`、`srcMode: 'wx'`；直接使用插件时 `srcMode` 默认跟随 `mode`。条件文件、区块 `mode`、属性 `@ali` 只筛选输出目标，源码方言由 `srcMode` / `src-mode` 及工程规则确定，见[条件编译](../base/conditional-compile.md)。

### 模板与样式配置

以下为 `MpxWebpackPlugin` 顶层选项，匹配方式见[规则匹配](../base/config-reference.md#规则匹配)，用法见[样式差异](./ali-style-reference.md)。

| 配置项 | 默认值 | 约束 |
| --- | --- | --- |
| `autoScopeRules` | `{}` | 用 include/exclude 按资源路径限定范围；命中文件的所有样式区块启用 scoped，未命中仍尊重 `<style scoped>` |
| `externalClasses` | `['custom-class', 'i-class']` | 与组件声明一致；自定义数组替换默认值，保留仍在使用的名称 |

业务资源与保留文件名 `mpx-ali-compat.acss` 冲突时重命名业务资源，不修改或重复引入框架生成文件。

## 开发者工具配置

### 启用 component2

支付宝组件依赖 `component2`，在开发者工具详情中启用，或将以下 `mini.project.json` 放入工程输出根目录：

```json
{ "component2": true }
```

这是开发者工具工程配置，不属于 `app.json`、页面 JSON 或插件选项；通过静态目录维护时确认已复制到输出根目录。component2 要求基础库 `>= 1.14.0`，不代表所有组件 / API 的统一最低版本。初始化异常或收到启用提示时先核对开关与实际基础库。
