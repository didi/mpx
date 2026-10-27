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

直接使用编译插件时，`srcMode` 默认跟随 `mode`；只设 `mode: 'ali'` 不会自动按微信语法转换。使用微信语法输出支付宝时，设置 `mode: 'ali'`、`srcMode: 'wx'`。条件文件、区块 `mode` 和属性 `@ali` 只筛选输出目标，不切换源码方言；源码方言按 `srcMode` / `src-mode` 及工程规则核对，见 [条件编译基准](../base/conditional-compile.md)。

### 模板与样式配置

以下均为 `MpxWebpackPlugin` 顶层选项，匹配方式沿用 [规则匹配](../base/config-reference.md#规则匹配)。

| 配置项 | 默认值 | 作用与约束 |
| --- | --- | --- |
| `autoScopeRules` | `{}` | 按资源路径批量启用 scoped；命中文件的所有样式区块均启用，未命中仍尊重单个 `<style scoped>`。使用 include/exclude 限定范围。 |
| `externalClasses` | `['custom-class', 'i-class']` | 声明支付宝编译需要处理的外部样式类名称；自定义数组替换默认值，保留仍在使用的名称，并与组件声明一致。 |

样式隔离、外部类的使用方式与示例见 [支付宝样式差异](./ali-style-reference.md)。

构建提示业务资源与保留文件名 `mpx-ali-compat.acss` 冲突时，重命名业务资源；不要修改或重复引入框架生成的样式文件。

## 开发者工具配置

### 启用 component2

支付宝组件运行依赖 `component2`。在开发者工具详情设置中启用，或确保工程输出根目录的 `mini.project.json` 包含：

```json
{
  "component2": true
}
```

它属于支付宝开发者工具的工程配置，不是 `app.json`、页面 JSON 或 `MpxWebpackPlugin` 的字段。使用静态资源目录维护时，确认构建已将文件复制到支付宝工程输出根目录。

启用 component2 的基础库要求为 `>= 1.14.0`；这只是 component2 的前提，不是本目录所有组件/API 的统一最低版本。遇到提示启用 component2 或组件初始化异常时，先核对该开关及实际基础库。
