# Mpx2Web 样式能力参考

小程序与 Web 的样式支持大致相同，绝大部分样式属性和选择器、CSS 变量、媒体查询等能力都可以正常使用。已有样式通常可以直接复用，具体 CSS 特性的兼容性以目标浏览器为准。

本文主要介绍 Mpx 输出 Web 时与输出微信小程序存在的差异，包括标签选择器、尺寸单位、样式隔离与组件宿主布局。

## 目录

- [CSS选择器](#css选择器)
- [单位与响应式尺寸](#单位与响应式尺寸)
  - [rpx](#rpx)
  - [px 自动转换](#px-自动转换)
- [样式隔离](#样式隔离)
  - [外部样式类](#外部样式类)
- [页面与组件宿主](#页面与组件宿主)

---

## CSS选择器

绝大部分 CSS 选择器在 Web 下可以正常使用。需要注意的是，Web 下的基础组件由框架提供内建实现，不支持使用 `view`、`text` 等小程序基础组件标签选择器设置样式；这类规则应改用业务类选择器。页面的 `page` 选择器用法见 [页面与组件宿主](#页面与组件宿主)。

---

## 单位与响应式尺寸

### rpx

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

### px 自动转换

已有的 `MpxWebpackPlugin.transRpxRules` 配置可继续使用，无需为输出 Web 额外开启。需要注意，规则转换出的 `rpx` 在 Web 下会继续换算成 `vw` 或自定义单位，而模板内联样式中的 `px` 不受该配置影响。未配置时，`px` 保持原样，`rpx` 仍可正常使用。

| 配置 | 行为 |
| --- | --- |
| `include` / `exclude` | 按样式资源路径选取文件；该规则省略 `include` 时默认全部匹配 |
| 规则数组 | 首个命中的规则生效，不叠加后续规则 |
| `mode: 'only'`（默认） | 只转换注释标记的声明或规则块，默认注释为 `/* use rpx */` |
| `mode: 'all'` | 转换匹配文件内的 `px`，默认用 `/* use px */` 排除声明或规则块 |
| `comment` | 自定义标记注释文本 |
| `designWidth` | 设计稿宽度，默认 `750`；例如 `375` 宽设计稿中的 `1px` 会换算成 `2rpx` |

注释放在目标声明前、规则前或规则末尾；规则前与末尾的标记作用于该规则块。例如启用 `mode: 'all'` 后：

```css
.card {
  width: 300px;
  /* use px */
  border-width: 1px;
}
```

此时宽度会继续转换成视口单位，边框保持 `1px`。该注释不会阻止显式写出的 `rpx` 在 Web 中转换，也不会处理模板内联样式的 `px`。

---

## 样式隔离

微信组件默认隔离的效果不会自动带到 Web。需要隔离时，单文件使用 `<style scoped>`；可以通过编译配置项 [autoScopeRules](./web-config-reference.md#模板与样式) 批量配置组件样式隔离。

```html
<style scoped>
.card {
  padding: 24rpx;
}
</style>
```

- scoped 限定当前样式的选择范围，不阻止外部全局 CSS 命中组件，也不取消浏览器的字体、颜色继承。
- 同文件中可混用 scoped 与普通样式区块，普通区块仍为全局样式。`autoScopeRules` 命中时，该文件的所有样式区块都会启用 scoped。
- Web 不支持小程序的 `styleIsolation` / `addGlobalClass` 配置；需要样式隔离时，使用 `<style scoped>` 或 `autoScopeRules`。
- 需要从外部定义子组件内部节点的样式时，优先使用 [外部样式类](#外部样式类)，由组件明确暴露可定制的节点。

### 外部样式类

外部样式类可沿用小程序的使用方式；输出 Web 时，还需在编译插件的 `externalClasses` 中配置使用到的名称，默认已有 `custom-class`、`i-class`。使用其他名称时，保持以下四处一致：

1. 在编译插件顶层 `externalClasses` 数组中加入名称，保留原有名称。
2. 在子组件 `createComponent({ externalClasses: [...] })` 中声明跨端组件契约，不写到 JSON 区块中。
3. 在子组件模板的静态 `class` 中使用同名占位类。
4. 调用方通过同名属性传入实际样式类。

```js
// MpxWebpackPlugin 选项片段；CLI 中放在 pluginOptions.mpx.plugin
externalClasses: ['custom-class', 'i-class', 'accent-class']
```

```js
// 子组件脚本
createComponent({ externalClasses: ['accent-class'] })
```

```html
<!-- 子组件模板 -->
<view class="card accent-class">内容</view>

<!-- 父组件模板，card-item 已在 usingComponents 中注册 -->
<card-item accent-class="accent" />
```

父组件用 `.accent { ... }` 定义样式，即可定制子组件中声明 `accent-class` 的节点；父组件使用 scoped 时也可按此方式定义外部样式。

新增名称必须同时配置到编译插件与组件脚本中；仅在调用方传 `class` 也不等同于指定内部节点的外部样式类。占位类应写在静态 `class` 中，不通过动态表达式拼接。

---

## 页面与组件宿主

`page` 设置页面样式、`:host` 设置组件宿主样式的基本用法可继续沿用，输出 Web 时需注意以下差异：

- **页面样式作用范围**：微信小程序的页面样式仅作用于当前页面；Web 中的 `page { ... }` 即使写在 scoped 区块中，也可能影响其他页面。页面独有样式应写到页面模板内明确的业务容器类上，并配合 scoped 使用。
- **`:host` 的使用位置**：Web 中仅支持在样式顶层使用，不放在 `@media` 等嵌套规则内。需要按媒体查询调整布局时，使用组件内部业务节点的类选择器。
- **虚拟宿主的配置方式**：小程序组件中的 `options.virtualHost` 不能直接用于 Web；Web 需通过编译配置项 [autoVirtualHostRules](./web-config-reference.md#模板与样式) 选取组件，且组件模板必须只有一个真实根节点。启用后，通过该根节点的业务类设置样式，不再依赖 `:host`。
