# 条件编译

对于跨平台无法兼容的部分，局部使用条件编译进行分平台定义是可以接受的，跨平台输出 RN 时通常原平台使用 `__mpx_mode__ === 'wx' || __mpx_mode__ === 'ali' || __mpx_mode__ === 'web'` 作为条件，而 RN 平台则使用 `__mpx_mode__ === 'ios' || __mpx_mode__ === 'android' || __mpx_mode__ === 'harmony'` 作为条件。

## 样式条件编译

```html
<style>
.container {
  /* @mpx-if (__mpx_mode__ === 'ios' || __mpx_mode__ === 'android' || __mpx_mode__ === 'harmony') */
  padding-top: 0; /* RN 自行处理安全区域 */
  /* @mpx-else */
  padding-top: 88rpx; /* 包含导航栏高度 */
  /* @mpx-endif */
}
</style>
```

### 避免产物中出现空选择器

样式条件编译后的产物中**不能留下空选择器（无样式内容的选择器）**。后续链路中的 CSS 预编译、PostCSS 插件等常会解析并遍历规则，空选择器容易触发解析错误或构建失败。

若仅在声明块内做条件编译，某一平台分支可能把块内全部规则裁掉，从而留下「有选择器、无声明」的非法片段。此时应把**整条规则（含选择器与花括号内的内容）**一并纳入条件编译，保证每个平台产物里要么输出完整规则，要么完全不输出该规则。

**❌ 避免（仅 RN 需要样式时，若只包在声明块内，原平台产物会得到空块 `.rn-only { }`）：**

```html
<style>
.rn-only {
  /* @mpx-if (__mpx_mode__ === 'ios' || __mpx_mode__ === 'android' || __mpx_mode__ === 'harmony') */
  padding-top: 0;
  flex: 1;
  /* @mpx-endif */
}
</style>
```

**✅ 推荐（将选择器与整条规则一并条件编译，原平台不输出该规则，避免空选择器）：**

```html
<style>
/* @mpx-if (__mpx_mode__ === 'ios' || __mpx_mode__ === 'android' || __mpx_mode__ === 'harmony') */
.rn-only {
  padding-top: 0;
  flex: 1;
}
/* @mpx-endif */
</style>
```

## 模板条件编译

模板条件编译提供了两种，常用的有 `wx:if` 条件编译和 `@mode` / `@_mode` 节点/属性维度的条件编译。

### wx:if 条件编译

直接使用 `wx:if` 和 `__mpx_mode__` 变量进行条件渲染，逻辑直观但灵活性较低。

```html
<template>
  <!-- 此处的 __mpx_mode__ 不需要声明数据，编译时会基于当前编译 mode 进行替换 -->
  <view wx:if="{{__mpx_mode__ === 'ios' || __mpx_mode__ === 'android' || __mpx_mode__ === 'harmony'}}">
    仅 RN 平台可见
  </view>
  <view wx:else>
    原平台可见
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
  <!-- 属性维度条件编译，仅在 RN 平台注入 numberOfLines，该属性为 RN 平台原生支持，使用 @mode 进行显式声明，输出 RN 时跳过属性跨平台语法转换-->
  <text
    class="title"
    numberOfLines@ios|android|harmony="{{1}}"
  >
    {{title}}
  </text>
  <!-- 属性维度条件编译，仅在 RN 平台注入 is-simple，该属性为 Mpx 转换支持，使用 @_mode 进行隐式声明，输出 RN 时保留属性跨平台语法转换-->
  <text
    class="content"
    is-simple@_ios|_android|_harmony
  >
    {{content}}
  </text>
</template>
```

```html
<template>
  <!-- 节点维度条件编译，使用 @_mode 进行隐式声明，仅在目标平台输出，并且保留节点与属性的跨平台语法转换 -->
  <view @_ios|_android|_harmony bindtap="handleTap" class="rn-only">仅 RN 可见</view>
</template>
```

```html
<template>
  <!-- 标签名动态替换，原平台输出 view，而在 RN 平台输出时，标签名将被替换为 mpx-custom-view -->
  <view mpxTagName@ios|android|harmony="mpx-custom-view">will be mpx-custom-view in RN</view>
</template>
```

## 脚本条件编译

在 `<script>` 中，可以通过访问 `__mpx_mode__` 获取当前编译 mode，进行平台差异逻辑编写（例如处理 RN 与原平台在选择器 API 上的差异等）。

**基础用法：**
```javascript
if (__mpx_mode__ === 'ios' || __mpx_mode__ === 'android' || __mpx_mode__ === 'harmony') {
  // 执行 RN 环境相关逻辑
} else {
  // 执行原平台相关逻辑
}
```

**三元表达式用法：**
```javascript
// 对于简单的变量赋值或传参，推荐使用三元表达式
const isRN = __mpx_mode__ === 'ios' || __mpx_mode__ === 'android' || __mpx_mode__ === 'harmony'
const apiUrl = isRN ? 'https://api.rn.com' : 'https://api.original.com'
```

## 配置条件编译

我们可以在 `<script name="json">` 中编写 `JS` 逻辑动态定义组件的 `JSON` 配置，可以访问 `__mpx_mode__` 和 `__mpx_env__` 环境变量进行条件编译，在不同的平台和环境下导出不同的 `JSON` 配置。

**示例：**
```html
<script name="json">
const isRN = __mpx_mode__ === 'ios' || __mpx_mode__ === 'android' || __mpx_mode__ === 'harmony'
const isDidiEnv = __mpx_env__ === 'didi'

// 动态定义引用的子组件
const usingComponents = isRN ? {
  'mpx-sticky-header': '../components/mpx-sticky-header',
  'mpx-sticky-section': '../components/mpx-sticky-section'
} : {
  'wx-sticky-header': '../components/wx-sticky-header',
  'wx-sticky-section': '../components/wx-sticky-section'
}

module.exports = {
  // 结合 __mpx_env__ 动态配置页面或组件的标题
  navigationBarTitleText: isDidiEnv ? '滴滴出行' : '示例页面',
  // 结合 __mpx_mode__ 动态配置平台差异化属性
  disableScroll: isRN ? false : true,
  usingComponents
}
</script>
```