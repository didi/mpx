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

本页适用于微信 JSON 方言输出支付宝的项目。应用 `window` 与页面 JSON 沿用基准字段；页面配置不要写入组件 JSON。支付宝原生 JSON 方言需按宿主契约配置。

## 应用配置

### tabBar

`tabBar.position`、`tabBar.borderStyle` 不支持，应移除或隔离到微信目标。使用自定义 tabBar 时，需在支付宝验证组件实现与交互。

### 不支持的应用字段

`resizable`、`debug`、`requiredBackgroundModes`、`workers`、`navigateToMiniProgramAppIdList`、`networkTimeout`、`functionalPages` 不支持，应移除或隔离到支持的目标端。不要依赖应用 `networkTimeout` 为支付宝设置请求默认超时，具体请求参数按 [API 实践](./ali-api-reference.md#请求登录与提示) 核对。

## 页面配置

### 不支持的页面字段与刷新

以下页面字段不支持，应移除或隔离到微信目标：

- `disableScroll`、`disableSwipeBack`：需要锁定滚动或限制返回时，另行设计支付宝方案。
- `navigationBarTextStyle`、`backgroundTextStyle`、`backgroundColorTop`、`backgroundColorBottom`、`pageOrientation`。

关闭下拉刷新与关闭纵向回弹需分别配置。`enablePullDownRefresh: false` 不表示关闭回弹；需要关闭回弹时设置 `allowsBounceVertical: 'NO'`。开启下拉刷新需要允许纵向回弹，不要同时配置 `enablePullDownRefresh: true` 与 `allowsBounceVertical: 'NO'`。

### 自定义导航栏

自定义导航栏使用 `navigationStyle: "custom"`：

```html
<script type="application/json">
{
  "navigationStyle": "custom"
}
</script>
```

支付宝自定义导航栏仍可能显示返回按钮等宿主控件，自定义区域需处理状态栏、安全区与点击区域。需要在页面恢复 App 中关闭的默认导航栏时，设置 `navigationStyle: 'default'`。

`navigationStyle` 只使用 `custom` / `default`。不要同时设置与其冲突的支付宝原生导航字段；自定义导航栏的标题应在业务视图中绘制。

以上为页面配置片段；合入业务页面时保留原有 `usingComponents` 等配置。平台插件、隐私与权限声明需分别配置。

### 区分禁止页面滚动与关闭纵向回弹

微信的 `disableScroll` 与支付宝的 `allowsBounceVertical` 不是等价配置。支付宝需要固定页面时，可关闭纵向回弹，并通过占满页面的固定根容器组织布局；单独设置 `allowsBounceVertical: 'NO'` 不能当作完整的页面滚动锁定。

**❌ 避免：**只把 `disableScroll: true` 换成 `allowsBounceVertical: 'NO'`，保留仍会撑开页面的内容结构。

**✅ 推荐：**对于明确需要固定页面框架的场景，支付宝使用固定根容器，局部可滚动内容放入有明确高度的 `scroll-view`。

```html
<template>
  <view class="page-root">
    <scroll-view class="page-scroll" scroll-y="{{true}}">
      <view>需要滚动的页面内容</view>
    </scroll-view>
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

  .page-scroll {
    height: 100%;
  }
</style>

<script name="json">
  const config = {}

  if (__mpx_mode__ === 'wx') {
    config.disableScroll = true
  } else if (__mpx_mode__ === 'ali') {
    config.allowsBounceVertical = 'NO'
  }

  module.exports = config
</script>
```

这会改变页面滚动结构，应结合导航栏、底部安全区和键盘弹起后的实际可用区域验证。只需解决某个弹层穿透时，优先使用局部蒙层方案，不要直接把整个业务页面改成固定布局。下拉刷新属于另一项交互能力，也应独立确认，不能由“关闭回弹”推断为已关闭刷新。

## 组件配置

### 组件命名冲突

`usingComponents` 中不要同时注册 `MyCard`、`myCard`、`my-card` 等统一为连字符小写形式后重名的组件；发生冲突时修改注册名称及对应模板引用。异步组件与占位声明沿用 [分包与异步化](../base/subpackage-reference.md)。

### 抽象节点默认组件

支付宝要求每个 `componentGenerics` 条目提供默认自定义组件；只写 `true` 或对象未提供 `default` 会产生编译错误。声明方式沿用 [抽象节点](../base/json-reference.md#抽象节点)，为实际抽象节点补齐默认组件：

```json
{
  "componentGenerics": {
    "item": {
      "default": "./default-item.mpx"
    }
  }
}
```

页面与组件中的注册名称、占位组件引用和抽象节点默认组件应保持一致。
