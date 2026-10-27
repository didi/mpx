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

支付宝没有与微信默认行为完全等价的组件样式隔离，同名类可能互相影响。业务组件使用 `<style scoped>`，或用插件 `autoScopeRules` 批量启用。

```html
<style scoped>
.title {
  color: red;
}
</style>
```

批量配置（合入现有 `MpxWebpackPlugin` 选项，`path` 为 Node.js 模块）：

```js
autoScopeRules: {
  include: [path.resolve(__dirname, 'src/components')]
}
```

按配置文件位置解析目录，用 `include` / `exclude` 限定范围，保留依赖全局样式的代码。UnoCSS 不替代其他自定义样式的隔离；默认值与匹配规则见 [autoScopeRules](./ali-config-reference.md#模板与样式配置)。

### 外部样式类

沿用[外部样式类基准](../base/style-reference.md#外部样式类)，并在插件顶层 `externalClasses` 中同步列出名称；自定义数组替换默认 `['custom-class', 'i-class']`，保留仍在使用的名称。

```js
externalClasses: ['custom-class', 'i-class', 'accent-class']
```

子组件声明外部类并在静态 `class` 中放置 `accent-class`，调用方以 `accent-class="业务类名"` 传值。仅声明组件属性不够，插件选项也不能写进页面 JSON。

## 文本与图片样式

### 溢出打点样式直接作用于 text

单行省略的宽度、裁剪与省略样式直接作用于目标 `text`；继承父级 `white-space` 不代表继承完整截断规则。图文混排只约束需要截断的文本，不给整段混排套用。

```html
<text class="title">{{title}}</text>
```

```css
.title {
  display: block;
  width: 240rpx;
  overflow: hidden;
  white-space: nowrap;
  text-overflow: ellipsis;
}
```

### 图片内边距交给外层容器

`image` 的 padding 在微信 / 支付宝可能导致尺寸和内容差异。留白交给外层容器，图片只设置自身尺寸与显示模式。

```html
<view style="padding: 24rpx;">
  <image src="{{bannerUrl}}" mode="aspectFit" style="width: 240rpx; height: 80rpx;" />
</view>
```
