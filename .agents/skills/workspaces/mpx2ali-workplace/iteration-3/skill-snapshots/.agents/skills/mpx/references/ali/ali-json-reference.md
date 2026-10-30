# 支付宝 JSON 配置差异

应用、页面与组件的 JSON 区块语法沿用 [JSON 基准](../base/json-reference.md)。本页补充需要用户处理的配置差异与限制；编译插件的 `mode`、`srcMode` 与 `autoScopeRules` 见 [配置参考](./ali-config-reference.md)。未列出的 JSON 字段仍需核对目标支持情况。

适用范围见 [支付宝入口](./index.md#适用范围)。

## 目录

- [适用范围](#适用范围)
- [应用配置](#应用配置)
  - [tabBar](#tabbar)
  - [不支持的应用字段](#不支持的应用字段)
- [页面配置](#页面配置)
  - [不支持的页面字段与刷新](#不支持的页面字段与刷新)
  - [自定义导航栏](#自定义导航栏)
  - [区分禁止页面滚动与关闭纵向回弹](#区分禁止页面滚动与关闭纵向回弹)
- [组件配置](#组件配置)
  - [组件命名冲突](#组件命名冲突)
  - [抽象节点默认组件](#抽象节点默认组件)

## 适用范围

适用于微信 JSON 方言输出支付宝；应用 `window` 与页面配置沿用基准字段，页面字段不写入组件 JSON。支付宝原生方言按宿主契约配置。

## 应用配置

### tabBar

`tabBar.position`、`tabBar.borderStyle` 不支持，移除或隔离到微信；自定义 tabBar 需验证支付宝组件实现与交互。

### 不支持的应用字段

`resizable`、`debug`、`requiredBackgroundModes`、`workers`、`navigateToMiniProgramAppIdList`、`networkTimeout`、`functionalPages` 不支持，移除或隔离到支持端。请求超时不能依赖应用 `networkTimeout`，按[请求 API](./ali-api-reference.md#请求登录与提示)核对。

## 页面配置

### 不支持的页面字段与刷新

- 不支持 `disableScroll`、`disableSwipeBack`；锁定滚动或限制返回需另行适配。
- 不支持 `navigationBarTextStyle`、`backgroundTextStyle`、`backgroundColorTop`、`backgroundColorBottom`、`pageOrientation`。以上字段移除或隔离到微信。
- **刷新与回弹独立配置**：`enablePullDownRefresh: false` 不关闭回弹；`allowsBounceVertical: 'NO'` 关闭回弹，不等价于关闭刷新或锁定页面滚动。开启下拉刷新须允许回弹，不能同时设置前者为 `true`、后者为 `'NO'`。

### 自定义导航栏

按本地仓库当前实现，`navigationStyle` 的 `custom` / `default` 声明由编译器自动转换。页面设为 `default` 可恢复 App 中关闭的默认导航栏；直接使用统一声明，不为旧版导航转换维护手动分支，也不叠加等价或冲突的支付宝原生导航字段。

```json
{ "navigationStyle": "custom" }
```

自定义模式仍可能显示返回按钮等宿主控件；标题由业务绘制，并处理状态栏、安全区和点击区域。合入页面 JSON 时保留 `usingComponents` 等原配置；平台插件、隐私与权限声明分别配置。

### 区分禁止页面滚动与关闭纵向回弹

`disableScroll` 与 `allowsBounceVertical` 不等价。明确需要固定页面框架时，支付宝可关闭回弹并固定根容器，局部滚动放入有明确高度的 `scroll-view`。

```html
<template>
  <view class="page-root">
    <scroll-view scroll-y="{{true}}" style="height: 100%;"><view>页面内容</view></scroll-view>
  </view>
</template>

<style>
.page-root {
  height: 100vh;
  /* @mpx-if (__mpx_mode__ === 'ali') */
  position: fixed;
  top: 0;
  right: 0;
  bottom: 0;
  left: 0;
  height: auto;
  /* @mpx-endif */
}
</style>

<script name="json">
const config = {}
if (__mpx_mode__ === 'wx') config.disableScroll = true
else if (__mpx_mode__ === 'ali') config.allowsBounceVertical = 'NO'
module.exports = config
</script>
```

此方案改变页面滚动结构，需验证导航栏、安全区、键盘弹起后的可用区域，并独立确认下拉刷新。仅弹层穿透时用[局部蒙层方案](./ali-template-reference.md#将蒙层与可滚动内容拆成兄弟节点)，不改整个页面布局。

## 组件配置

### 组件命名冲突

`usingComponents` 中的名称转为连字符小写后须唯一（如 `MyCard`、`myCard`、`my-card` 会冲突）；修改时同步模板引用。异步组件与占位声明见[分包与异步化](../base/subpackage-reference.md)。

### 抽象节点默认组件

每个 `componentGenerics` 条目须提供默认自定义组件；只写 `true` 或缺少 `default` 会编译报错。声明方式见[抽象节点](../base/json-reference.md#抽象节点)。

```json
{
  "componentGenerics": {
    "item": { "default": "./default-item.mpx" }
  }
}
```

页面 / 组件的注册名称、占位引用与默认组件保持一致。
