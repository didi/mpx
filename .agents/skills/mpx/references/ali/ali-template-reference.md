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

手机号和用户信息授权按钮使用静态 `open-type="getPhoneNumber"` / `open-type="getUserInfo"`；需要动态切换授权类型时，使用独立条件节点，不使用 `open-type="{{type}}"`。

`contact`、`launchApp`、`openSetting`、`feedback` 不支持，应隔离到支持的目标端或提供支付宝方案。授权回调按支付宝实际数据结构处理，不能直接复用依赖微信手机号或用户信息结构的业务逻辑。

### 不支持项与告警边界

`live-pusher`、`live-player`、`audio`、`functional-page-navigator`、`editor` 不支持，需替换实现或隔离到支持的目标端。以下是常见的不支持属性与事件，并非完整列表：

| 组件 | 不支持的属性或事件 |
| --- | --- |
| input | `cursor-spacing`、`auto-focus`、`adjust-position`、`hold-keyboard`；`keyboardheightchange` 事件。 |
| text / image | text 的 `user-select`；image 的 `show-menu-by-longpress`。 |
| scroll-view | `enable-flex`、`scroll-anchoring`、`enhanced`、`bounces`、`paging-enabled`、`fast-deceleration`、`refresher-enabled/threshold/default-style/background/triggered`；`dragstart/dragging/dragend`、`refresherpulling/refresherrefresh/refresherrestore/refresherabort` 事件。 |

滚动条显隐按 [隐藏滚动条](#按平台隐藏滚动条) 配置。遇到不支持告警时，应隔离相关属性或事件，并为业务依赖的能力提供支付宝实现；不能仅凭编译成功判断可用。

## 输入框与键盘

### 按宿主与操作系统选择输入框属性

固定定位弹层中的输入框需要同时区分“小程序宿主”和“设备操作系统”。`__mpx_mode__ === 'ali'` 表示输出支付宝小程序，不能据此判断运行设备是 iOS 还是 Android。

| 场景 | 适配方式 | 使用边界 |
| --- | --- | --- |
| 微信 iOS | `always-embed="{{true}}"` | 仅作用于 iOS，需验证目标宿主版本 |
| 微信 Android | 出现自动上推留白时，考虑关闭 `adjust-position` 后手动处理 | 仅在复现问题时采用，不默认关闭自动上推 |
| 支付宝 iOS | `enableNative="{{true}}"` | 出现光标偏移时验证此配置 |
| 支付宝 Android | `enableNative="{{false}}"` | 出现大片留白时验证此配置 |

**❌ 避免：**在支付宝所有设备上写死同一个 `enableNative` 值，或把微信的键盘上推属性当成支付宝的等价能力。

```html
<template>
  <input enableNative@ali="{{true}}" />
</template>
```

**✅ 推荐：**将宿主专有属性限定在对应目标平台，并通过运行时系统信息提供 `isIOS`。

```html
<template>
  <input
    always-embed@wx="{{true}}"
    enableNative@ali="{{isIOS}}"
  />
</template>
```

这里的 `isIOS` 是业务侧依据实际设备系统信息得到的布尔值，需在页面或组件数据中提供。不要用 `__mpx_mode__ === 'ios'` 生成它：`ios` 是 Mpx 输出 RN 的目标标识，不是支付宝小程序内的设备判断。

### 处理键盘事件时序与首次聚焦

微信不同键盘类型、收起方式与输入框切换场景下，`keyboardheightchange` 的触发情况可能不同，`focus`、`blur` 与高度变化事件也没有可依赖的固定先后顺序。支付宝弹层首次显示时立即聚焦，还可能出现键盘弹起但页面未按预期上推的情况。

**❌ 避免：**

- 仅监听 `keyboardheightchange`，认为每次键盘开合都会通知。
- 任意输入框触发 `blur` 就立即把键盘高度清零，忽略另一个输入框可能正在获得焦点。
- 弹层刚开始渲染就强制聚焦，依赖固定延迟适配所有设备。
- 未复现问题就同时启用宿主自动上推和业务手动位移。

**✅ 推荐：**

1. 先验证当前宿主的自动上推行为；仅在复现问题后选择手动处理。
2. 微信若改用手动位移，应关闭相应输入框的 `adjust-position`，结合 `focus`、`blur` 与 `keyboardheightchange` 维护当前聚焦输入框及键盘状态。
3. 输入框切换时，延后确认是否仍有输入框聚焦，再决定是否复位；不要假设事件到达顺序。
4. 支付宝首次弹层聚焦应等待弹层实际渲染完成；存在入场动画时，还需结合弹层的完成时机。
5. 将文字键盘、数字键盘、主动收起、触摸滚动收起、连续切换输入框分别纳入真机验证。

支付宝键盘位移应按实际弹层结构与宿主表现处理，不直接套用微信 `adjust-position`，也不使用固定延迟或固定键盘高度。

## 滚动容器与弹层

### 按平台隐藏滚动条

滚动条默认显隐与 CSS 隐藏效果受宿主、系统和机型影响，需在目标真机验证，不能只依赖 CSS 隐藏。

**❌ 避免：**将 `show-scrollbar` 限定为仅微信生效，导致支付宝端未配置隐藏滚动条；也不要使用全局 `::-webkit-scrollbar` 影响全部滚动容器。

```html
<template>
  <scroll-view scroll-x="{{true}}" show-scrollbar@wx="{{false}}">
    <view class="content">横向滚动内容</view>
  </scroll-view>
</template>
```

**✅ 推荐：**微信单独开启 `enhanced`，需要隐藏滚动条的节点使用 `show-scrollbar="{{false}}"`。

```html
<template>
  <scroll-view
    scroll-x="{{true}}"
    enhanced@wx="{{true}}"
    show-scrollbar="{{false}}"
  >
    <view class="content">横向滚动内容</view>
  </scroll-view>
</template>

<style>
  .content {
    width: 1200rpx;
  }
</style>
```

动态值仅在运行结果为布尔值 `false` 时隐藏；字符串 `"false"`、`undefined`、`null` 和 `0` 均保持宿主默认行为。传入 `true` 恢复宿主默认行为，不保证所有设备都显示滚动条。

隐藏效果需通过完整 App 构建验证；独立分包、插件和单独编译的页面或组件需单独验证。`enhanced`、`refresher-*`、`paging-enabled` 等微信专有能力应按支持范围隔离。仍需在能观察到原始滚动条的目标真机上验证并列、嵌套、横向和纵向滚动，不能用设备本来就不显示滚动条作为隐藏能力的通过依据。

### 将蒙层与可滚动内容拆成兄弟节点

支付宝 `view` 开启 `disable-scroll` 后，会影响其子元素滚动。如果将弹层内的 `scroll-view` 放在禁止滚动的蒙层内部，可能在阻止背景穿透的同时禁用了弹层自身滚动。

**❌ 避免：**给包住全部弹层内容的节点开启 `disable-scroll`。

```html
<template>
  <view class="mask" disable-scroll@ali="{{true}}">
    <view class="dialog">
      <scroll-view scroll-y="{{true}}" class="dialog-scroll">
        <view>弹层内容</view>
      </scroll-view>
    </view>
  </view>
</template>
```

**✅ 推荐：**蒙层负责拦截背景操作，可滚动弹层作为兄弟节点单独布局。微信在弹层外层绑定 `catchtouchmove` 空处理函数。

```html
<template>
  <view class="dialog-root" catchtouchmove@wx="stopMove">
    <view class="mask" disable-scroll@ali="{{true}}"></view>
    <view class="dialog">
      <scroll-view class="dialog-scroll" scroll-y="{{true}}">
        <view>弹层内容</view>
      </scroll-view>
    </view>
  </view>
</template>

<script>
  import { createComponent } from '@mpxjs/core'

  createComponent({
    methods: {
      stopMove () {}
    }
  })
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

  .dialog-scroll {
    height: 600rpx;
  }
</style>
```

此结构仍需验证“背景不滚动、内容能滚动”两个目标。地图同层渲染、嵌套滚动、`movable-view` 等场景可能需要结合实际 viewport 尺寸处理局部布局；不要把局部弹层补丁扩展成全局 `page { overflow: hidden }`。
