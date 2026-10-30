# 支付宝模板与组件差异

本页补充微信语法输出支付宝时的事件与组件使用限制，以及输入框、键盘、滚动容器与弹层适配；通用绑定、事件和组件用法见 [模板基准](../base/template-reference.md)，平台属性隔离见 [条件编译](../base/conditional-compile.md)。本页不是完整组件支持表，未收录的属性不能据此推断为支持。

适用范围见 [支付宝入口](./index.md#适用范围)。

## 目录

- [模板支持限制](#模板支持限制)
  - [授权按钮](#授权按钮)
  - [不支持项与告警边界](#不支持项与告警边界)
- [输入框与键盘](#输入框与键盘)
  - [按宿主与操作系统选择输入框属性](#按宿主与操作系统选择输入框属性)
  - [处理键盘事件时序与首次聚焦](#处理键盘事件时序与首次聚焦)
- [滚动容器与弹层](#滚动容器与弹层)
  - [按平台隐藏滚动条](#按平台隐藏滚动条)
  - [将蒙层与可滚动内容拆成兄弟节点](#将蒙层与可滚动内容拆成兄弟节点)

## 模板支持限制

### 授权按钮

- 手机号 / 用户信息授权使用静态 `open-type="getPhoneNumber"` / `open-type="getUserInfo"`；动态切换用独立条件节点，不用 `open-type="{{type}}"`。
- `contact`、`launchApp`、`openSetting`、`feedback` 不支持，需隔离或替代；授权回调按支付宝数据结构处理，不直接复用依赖微信字段的逻辑。

```html
<button wx:if="{{needPhone}}" open-type="getPhoneNumber">授权手机号</button>
<button wx:else open-type="getUserInfo">授权用户信息</button>
```

### 不支持项与告警边界

`live-pusher`、`live-player`、`audio`、`functional-page-navigator`、`editor` 不支持。常见属性 / 事件限制如下，非完整列表：

| 组件 | 不支持的属性或事件 |
| --- | --- |
| input | `cursor-spacing`、`auto-focus`、`adjust-position`、`hold-keyboard`；`keyboardheightchange` 事件 |
| text / image | text 的 `user-select`；image 的 `show-menu-by-longpress` |
| scroll-view | `enable-flex`、`scroll-anchoring`、`enhanced`、`bounces`、`paging-enabled`、`fast-deceleration`、`refresher-enabled/threshold/default-style/background/triggered`；`dragstart/dragging/dragend`、`refresherpulling/refresherrefresh/refresherrestore/refresherabort` 事件 |

遇到告警时隔离不支持项，并为业务依赖的能力提供支付宝实现；编译成功不代表可用。滚动条配置见[隐藏滚动条](#按平台隐藏滚动条)。

## 输入框与键盘

### 按宿主与操作系统选择输入框属性

固定弹层输入框推荐按宿主与设备系统分别适配。

| 场景 | 配置与边界 |
| --- | --- |
| 微信 iOS | `always-embed="{{true}}"`，需验证目标宿主版本 |
| 微信 Android | 自动上推出现留白时，考虑关闭 `adjust-position` 后手动位移，不默认关闭 |
| 支付宝 iOS | 光标偏移时验证 `enableNative="{{true}}"` |
| 支付宝 Android | 大片留白时验证 `enableNative="{{false}}"` |

`isIOS` 由运行时设备信息提供；`ali` 是输出目标，`ios` 是 RN 目标，均不能代替支付宝内的系统判断。宿主专有属性用后缀隔离，不将微信上推属性当作支付宝等价能力。

```html
<input always-embed@wx="{{true}}" enableNative@ali="{{isIOS}}" />
```

### 处理键盘事件时序与首次聚焦

1. **统一管理键盘位移**：优先使用宿主自动上推；需要业务控制位移时，避免与自动上推叠加。微信手动位移需关闭对应输入框的 `adjust-position`；支付宝按实际弹层结构适配，不套用该属性。
2. **联合维护焦点与键盘状态**：微信 `keyboardheightchange` 不保证每次开合触发，且与 `focus` / `blur` 无固定顺序。切换输入框时延后确认是否仍有焦点，再决定复位，不在任意 `blur` 时立即清零。
3. **首次聚焦等待就绪**：支付宝弹层需等实际渲染及入场动画完成后聚焦，避免键盘弹起却未上推；不使用统一延迟或固定键盘高度。
4. **真机验证**：覆盖文字 / 数字键盘、主动 / 触摸滚动收起、连续切换输入框。

## 滚动容器与弹层

### 按平台隐藏滚动条

- 需要隐藏的节点共用 `show-scrollbar="{{false}}"`，微信另开 `enhanced@wx`；不要仅对微信设置隐藏，也不要用全局 `::-webkit-scrollbar`。其他微信专有能力按支持范围隔离。
- **只接受严格布尔值 `false` 隐藏**；字符串 `"false"`、`undefined`、`null`、`0` 保持默认，`true` 恢复默认但不保证显示。
- **验证实际效果**：使用完整 App 构建；独立分包、插件、单独编译的页面 / 组件需单独集成验证。在原本能看到滚动条的真机上覆盖并列、嵌套、横向和纵向滚动，不能以设备默认不显示作为通过依据。

```html
<scroll-view scroll-x="{{true}}" enhanced@wx="{{true}}" show-scrollbar="{{false}}">
  <view style="width: 1200rpx;">横向滚动内容</view>
</scroll-view>
```

### 将蒙层与可滚动内容拆成兄弟节点

支付宝 `disable-scroll` 会影响子元素滚动：只对蒙层开启，将可滚动弹层放在兄弟节点；微信在弹层外层绑定 `catchtouchmove` 空处理函数。

示例的 `stopMove(e): void` 接收触摸事件对象，但不使用其字段，因此可省略形参；无需返回 `false`，阻止冒泡由 `catchtouchmove` 绑定完成。通用事件对象与绑定规则见[模板基准](../base/template-reference.md#事件绑定)。

```html
<template>
  <view class="dialog-root" catchtouchmove@wx="stopMove">
    <view class="mask" disable-scroll@ali="{{true}}" />
    <view class="dialog">
      <scroll-view scroll-y="{{true}}" style="height: 600rpx;">
        <view>弹层内容</view>
      </scroll-view>
    </view>
  </view>
</template>

<script>
import { createComponent } from '@mpxjs/core'
createComponent({ methods: { stopMove () {} } })
</script>

<style>
.dialog-root {
  position: fixed;
  top: 0;
  right: 0;
  bottom: 0;
  left: 0;
  z-index: 1000;
}
.mask {
  position: absolute;
  top: 0;
  right: 0;
  bottom: 0;
  left: 0;
  background-color: rgba(0, 0, 0, 0.5);
}
.dialog {
  position: absolute;
  right: 0;
  bottom: 0;
  left: 0;
  background-color: #fff;
}
</style>
```

同时验证背景不滚动、内容能滚动。地图同层渲染、嵌套滚动、`movable-view` 等按实际 viewport 局部适配，不扩展成全局 `page { overflow: hidden }`。
