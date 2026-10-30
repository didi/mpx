# Web 样式差异

小程序与 Web 的样式支持大致相同，绝大部分样式属性和选择器、CSS 变量、媒体查询等能力都可以正常使用。已有样式通常可以直接复用，具体 CSS 特性的兼容性以目标浏览器为准。

本页按 [样式基准](../base/style-reference.md) 的主题顺序组织，描述 Web 的选择器、尺寸单位、样式作用范围、样式隔离与组件宿主差异。

## 目录

- [样式规则与选择器](#样式规则与选择器)
- [尺寸单位](#尺寸单位)
  - [rpx 自动转换](#rpx-自动转换)
- [样式引入与作用范围](#样式引入与作用范围)
  - [样式隔离](#样式隔离)
  - [外部样式类](#外部样式类)
- [页面与组件宿主](#页面与组件宿主)

## 样式规则与选择器

绝大部分 CSS 选择器在 Web 下可以正常使用。需要注意的是，Web 下的基础组件由框架提供内建实现，不支持使用 `view`、`text` 等小程序基础组件标签选择器设置样式；这类规则应改用业务类选择器。页面的 `page` 选择器用法见 [页面与组件宿主](#页面与组件宿主)。

## 尺寸单位

### rpx 自动转换

- 样式声明值中的 `rpx` 默认按 **`750rpx = 100vw`** 换算。
- 模板 `style` / `wx:style` 中的字符串值也支持 `rpx`。未启用额外转换规则时，`px` 与浏览器原生单位保持原样。
- 在 Web HTML 入口配置 viewport，例如 `<meta name="viewport" content="width=device-width, initial-scale=1">`，使移动端视口符合预期。
- `rpx` 基于视口宽度，不基于组件容器宽度；PC 宽屏或固定宽度容器中的布局需要按实际需求调整。
- 媒体查询可正常使用，但 **Web 的 `@media` 条件中不支持 `rpx`**。断点使用 `px`、`em` 等浏览器支持的单位，查询规则内的样式声明仍可使用 `rpx`。
- `@font-face` 中使用浏览器可识别的单位，不使用 `rpx`。

需要改变换算方式时，在 **编译插件** 的 `webConfig.transRpxFn` 中配置：

```js
new MpxWebpackPlugin({
  mode: 'web',
  srcMode: 'wx',
  webConfig: {
    // 示例：固定按 2rpx = 1px 输出，不再随视口缩放
    transRpxFn: function (match, value) {
      return Number(value) / 2 + 'px'
    }
  }
})
```

该配置同时影响样式区块与模板内联样式。函数前两个参数为完整匹配和数值部分字符串，例如 `'20rpx'`、`'20'`，返回带单位的字符串。使用自包含的普通函数表达式，不引用构建配置闭包变量、Node 模块或浏览器全局对象。这里不是运行时 `Mpx.config.webConfig` 的配置项。

通用的 `px → rpx` 配置与注释规则见 [rpx 自动转换](../base/style-reference.md#rpx-自动转换)。已有的 `MpxWebpackPlugin.transRpxRules` 配置可继续使用，无需为输出 Web 额外开启；规则转换出的 `rpx` 会继续换算成 `vw` 或 `webConfig.transRpxFn` 指定的单位。`/* use px */` 不会阻止显式写出的 `rpx` 在 Web 中转换。

## 样式引入与作用范围

样式引入的通用写法见 [样式引入与作用范围](../base/style-reference.md#样式引入与作用范围)。Web 中未启用 scoped 的普通样式区块为全局样式，页面与组件均需按需隔离，具体要求见 [样式隔离](#样式隔离)。

### 样式隔离

通用用法见 [样式隔离基准](../base/style-reference.md#样式隔离)，Web 需注意：

- 微信组件默认隔离的效果不会自动带到 Web，且 Web 不支持小程序的 `styleIsolation` / `addGlobalClass` 配置；需要隔离时，使用 `<style scoped>` 或 `autoScopeRules`。
- scoped 限定当前样式的选择范围，不阻止外部全局 CSS 命中组件，也不取消浏览器的字体、颜色继承。

### 外部样式类

声明、模板占位类与调用方式见 [外部样式类基准](../base/style-reference.md#外部样式类)。Web 还需在编译插件的 `externalClasses` 中配置使用到的名称，默认已有 `custom-class`、`i-class`；自定义数组会替换默认值，保留仍在使用的名称，并与组件声明保持一致。

```js
// MpxWebpackPlugin 选项片段；CLI 中放在 pluginOptions.mpx.plugin
externalClasses: ['custom-class', 'i-class', 'accent-class']
```

- 子组件中的占位类应写在静态 `class` 中，不通过动态表达式拼接。
- 父组件使用 scoped 时，仍可通过外部样式类定制子组件内部节点。

## 页面与组件宿主

通用用法见 [页面与组件宿主基准](../base/style-reference.md#页面与组件宿主)，Web 需注意：

- **页面样式作用范围**：微信小程序的页面样式仅作用于当前页面；Web 中的 `page` 选择器与普通类选择器一样，需要通过 `<style scoped>` 或 `autoScopeRules` 实现隔离。组合选择器及 `@media`、`@supports` 内的 `page` 规则同样遵循 scoped 隔离。未启用 scoped 的 `page` 规则仍为全局样式，公共规则建议放在 `app.mpx` 的普通样式区块中。外部引入样式沿用现有组件样式隔离链路。
- **`:host` 的使用位置**：Web 中仅支持在样式顶层使用，不放在 `@media` 等嵌套规则内。需要按媒体查询调整布局时，使用组件内部业务节点的类选择器。
- **虚拟宿主的配置方式**：小程序组件中的 `options.virtualHost` 不能直接用于 Web；Web 需通过编译配置项 [autoVirtualHostRules](../base/config-reference.md#模板与样式配置) 选取组件，且组件模板必须只有一个真实根节点。启用后的布局调整见 [虚拟宿主基准](../base/style-reference.md#虚拟宿主)。
