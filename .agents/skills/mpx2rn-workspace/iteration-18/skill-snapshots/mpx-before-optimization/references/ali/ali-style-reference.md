# 支付宝样式差异

本页补充支付宝的样式作用范围、组件样式隔离、外部样式类，以及文本截断与图片留白的布局差异。通用语法、单位与样式引入见 [样式基准](../base/style-reference.md)；编译选项的默认值与匹配规则见 [配置参考](./ali-config-reference.md#模板与样式配置)。

适用范围见 [支付宝入口](./index.md#适用范围)。

## 目录

- [样式引入与作用范围](#样式引入与作用范围)
  - [样式隔离](#样式隔离)
  - [外部样式类](#外部样式类)
- [文本与图片样式](#文本与图片样式)
  - [溢出打点样式直接作用于 text](#溢出打点样式直接作用于-text)
  - [图片内边距交给外层容器](#图片内边距交给外层容器)

## 样式引入与作用范围

### 样式隔离

支付宝没有与微信默认行为完全等价的组件样式隔离。页面和组件中常见的 `.title`、`.left`、`.item` 等类名可能互相影响，跨端后容易出现“组件代码没变，样式却变了”的问题。

**❌ 避免：**依赖微信默认隔离行为，在支付宝目标中无约束地复用通用类名。

```html
<style>
  .title {
    color: red;
  }
</style>
```

**✅ 推荐：**对业务组件目录启用 `autoScopeRules`，或在单个组件的 `style` 上声明 `scoped`。

```js
// 合并到现有 MpxWebpackPlugin 配置中；path 为 Node.js 的 path 模块。
autoScopeRules: {
  include: [path.resolve(__dirname, 'src/components')]
}
```

```html
<template>
  <view class="title">组件标题</view>
</template>

<style scoped>
  .title {
    color: red;
  }
</style>
```

通过 `include` / `exclude` 控制作用范围，按实际配置文件位置解析目录，避免影响依赖全局样式的代码。使用 UnoCSS 原子类时，其他自定义样式仍需单独处理隔离。

配置详情见 [autoScopeRules](./ali-config-reference.md#模板与样式配置)。

### 外部样式类

组件声明、模板占位类和调用方传值沿用 [外部样式类基准](../base/style-reference.md#外部样式类)。支付宝还需在编译插件顶层的 `externalClasses` 中列出使用的名称；默认包含 `custom-class`、`i-class`，自定义数组会替换默认值。

```js
// 合并到已有 MpxWebpackPlugin 选项；保留仍在使用的默认名称。
externalClasses: ['custom-class', 'i-class', 'accent-class']
```

在子组件静态 `class` 中使用 `accent-class` 占位，调用方通过 `accent-class="业务类名"` 传值。不要将编译插件配置误写到页面 JSON，也不要只声明组件的 `externalClasses` 而遗漏编译配置。

## 文本与图片样式

### 溢出打点样式直接作用于 text

文本截断仍需明确承担布局的节点。父容器可以控制换行，但内部 `text` 继承 `white-space` 并不意味着同时继承宽度、裁剪和省略规则；不要仅凭换行正常就认为省略效果也已满足。

需要单行省略时，可直接在 `text` 上声明宽度与溢出样式：

```html
<template>
  <text class="title">{{title}}</text>
</template>

<style>
  .title {
    display: block;
    width: 240rpx;
    overflow: hidden;
    white-space: nowrap;
    text-overflow: ellipsis;
  }
</style>
```

图文混排时，应先明确哪一段文字需要截断，再约束对应文本节点的宽度，不应直接给整段混排内容套用此示例。

### 图片内边距交给外层容器

直接在 `image` 上设置 `padding`，微信与支付宝可能出现不同的图片尺寸和内容显示结果。外部留白使用容器的内边距，图片节点只设置自身尺寸。

**❌ 避免：**图片尺寸与内边距混在同一个节点上。

```html
<template>
  <image class="banner" src="{{bannerUrl}}" />
</template>

<style>
  .banner {
    width: 240rpx;
    height: 80rpx;
    padding: 24rpx;
  }
</style>
```

**✅ 推荐：**外层容器负责内边距，`image` 只负责图片尺寸与显示模式。

```html
<template>
  <view class="banner-wrapper">
    <image class="banner" src="{{bannerUrl}}" mode="aspectFit" />
  </view>
</template>

<style>
  .banner-wrapper {
    padding: 24rpx;
  }

  .banner {
    width: 240rpx;
    height: 80rpx;
  }
</style>
```
