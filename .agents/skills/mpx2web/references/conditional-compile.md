# 条件编译

对于跨平台无法兼容的部分，局部使用条件编译进行分平台定义是可以接受的。跨平台输出 Web 时，通常 **Web 平台**使用 `__mpx_mode__ === 'web'` 作为条件，**小程序原平台**使用 `__mpx_mode__ === 'wx' || __mpx_mode__ === 'ali'`（按项目实际目标补充 `swan` / `qq` / `tt` / `jd`）作为条件。若工程同时维护 RN，请额外覆盖 `ios` / `android` / `harmony`。

## 目录

- [样式条件编译](#样式条件编译)
  - [避免产物中出现空选择器](#避免产物中出现空选择器)
- [模板条件编译](#模板条件编译)
  - [wx:if 条件编译](#wxif-条件编译)
  - [节点/属性维度条件编译](#节点属性维度条件编译)
- [脚本条件编译](#脚本条件编译)
- [配置条件编译](#配置条件编译)

---

## 样式条件编译

> **⚠️ `@mpx-if` 注释语法条件编译仅限在 `<style>` 区块内使用**，**严禁**在 `<style>` 区块以外的位置使用，不会生效。

```html
<style>
.container {
  /* @mpx-if (__mpx_mode__ === 'web') */
  position: sticky; /* Web 支持 sticky 定位 */
  /* @mpx-else */
  position: relative; /* 小程序侧等效处理 */
  /* @mpx-endif */
}
</style>
```

### 避免产物中出现空选择器

样式条件编译后的产物中**不能留下空选择器（无样式内容的选择器）**。后续链路中的 CSS 预编译、PostCSS 插件等常会解析并遍历规则，空选择器容易触发解析错误或构建失败。

若仅在声明块内做条件编译，某一平台分支可能把块内全部规则裁掉，从而留下「有选择器、无声明」的非法片段。此时应把**整条规则（含选择器与花括号内的内容）**一并纳入条件编译，保证每个平台产物里要么输出完整规则，要么完全不输出该规则。

**❌ 避免（仅 Web 需要样式时，若只包在声明块内，小程序产物会得到空块 `.web-only { }`）：**

```html
<style>
.web-only {
  /* @mpx-if (__mpx_mode__ === 'web') */
  position: fixed;
  z-index: 999;
  /* @mpx-endif */
}
</style>
```

**✅ 推荐（将选择器与整条规则一并条件编译，小程序不输出该规则，避免空选择器）：**

```html
<style>
/* @mpx-if (__mpx_mode__ === 'web') */
.web-only {
  position: fixed;
  z-index: 999;
}
/* @mpx-endif */
</style>
```

---

## 模板条件编译

模板条件编译提供了两种，常用的有 `wx:if` 条件编译和 `@mode` / `@_mode` 节点/属性维度的条件编译。

### wx:if 条件编译

直接使用 `wx:if` 和 `__mpx_mode__` 变量进行条件渲染，逻辑直观但灵活性较低。

```html
<template>
  <!-- 此处的 __mpx_mode__ 不需要声明数据，编译时会基于当前编译 mode 进行替换 -->
  <view wx:if="{{__mpx_mode__ === 'web'}}">
    仅 Web 平台可见
  </view>
  <view wx:else>
    小程序平台可见
  </view>
</template>
```

### 节点/属性维度条件编译

使用 `@` 和 `|` 符号来指定某个节点或属性只在某些平台下有效。这种方式更加灵活简洁。

- **显式声明 (`@mode`)**：节点或属性仅在目标平台下输出，节点或属性为目标平台原生支持，**框架会跳过对该节点或属性的跨平台语法转换**。
- **隐式声明 (`@_mode`)**：节点或属性仅在目标平台下输出，节点或属性为 Mpx 转换支持，**框架仍然会对其进行正常的跨平台语法转换**。
- **标签名动态替换 (`mpxTagName@mode`)**：结合 `@mode` 属性，可以对模板组件的 `tagName` 进行分平台条件编译。当节点存在该属性时，在输出到对应平台时会将节点标签修改为该属性的值。

**示例：**

```html
<template>
  <!-- 属性维度条件编译，仅在 Web 平台注入 data-web 属性，使用 @mode 显式声明，输出 Web 时跳过属性跨平台语法转换 -->
  <view
    class="title"
    some-web-attr@web="value"
  >
    {{title}}
  </view>
  <!-- 节点维度条件编译，使用 @_mode 隐式声明，仅在 Web 平台输出，并保留节点与属性的跨平台语法转换 -->
  <view @_web bindtap="handleTap" class="web-only">仅 Web 可见</view>
</template>
```

```html
<template>
  <!-- 标签名动态替换，小程序输出 view，而在 Web 平台输出时，标签名将被替换为 mpx-custom-view -->
  <view mpxTagName@web="mpx-custom-view">will be mpx-custom-view in Web</view>
</template>
```

---

## 脚本条件编译

在 `<script>` 中，可以通过访问 `__mpx_mode__` 获取当前编译 mode，进行平台差异逻辑编写（例如处理 Web 与小程序在路由、DOM、环境 API 上的差异等）。

**基础用法：**
```javascript
if (__mpx_mode__ === 'web') {
  // 执行 Web 环境相关逻辑，如直接访问 window / document / 第三方 H5 SDK
} else {
  // 执行小程序原平台相关逻辑
}
```

**三元表达式用法：**
```javascript
// 对于简单的变量赋值或传参，推荐使用三元表达式
const isWeb = __mpx_mode__ === 'web'
const apiUrl = isWeb ? 'https://api.web.com' : 'https://api.mp.com'
```

---

## 配置条件编译

我们可以在 `<script name="json">` 中编写 `JS` 逻辑动态定义组件的 `JSON` 配置，可以访问 `__mpx_mode__` 和 `__mpx_env__` 环境变量进行条件编译，在不同的平台和环境下导出不同的 `JSON` 配置。

**示例：**
```html
<script name="json">
const isWeb = __mpx_mode__ === 'web'
const isDidiEnv = __mpx_env__ === 'didi'

module.exports = {
  // 结合 __mpx_env__ 动态配置页面或组件的标题
  navigationBarTitleText: isDidiEnv ? '滴滴出行' : '示例页面',
  // 小程序专属字段在 Web 不支持，按平台隔离（示意）
  ...(isWeb ? {} : { enablePullDownRefresh: true })
}
</script>
```
