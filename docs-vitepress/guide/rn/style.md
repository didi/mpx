# 跨端样式定义

## 概述

RN 样式属性和 Web/小程序中 CSS 样式属性是相交关系：

- **RN 独有属性**：`tintColor`、`writingDirection` 等，CSS 不支持
- **CSS 独有属性**：`clip-path`、`animation`、`transition` 等，RN 不支持

因此，在跨平台开发时：
1. **优先使用交集属性**：尽量使用两边都支持的样式属性
2. **框架抹平差异**：Mpx 内部对 RN 样式进行了部分抹平处理

## 样式处理机制

Mpx 框架在样式处理方面的工作分为两大类：

### 编译时的 class 类样式转化

- ✅ 属性名转驼峰
- ✅ 单位的校验和对齐
- ✅ 过滤 RN 不支持的属性和属性值
- ✅ 简写转换
- ✅ 样式属性差异转换和拉齐

### 运行时的 style 样式处理

- ✅ 属性名转驼峰
- ✅ 单位的计算和处理
- ✅ 100% 计算
- ✅ CSS 函数处理：`env()`、`calc()`、`var()`
## CSS 选择器

RN 环境下**仅支持单个类选择器**，不支持类名组合选择器。不过逗号组合的选择器本质上还是单类选择器，所以是可以支持的。

```css
/* ✅ 支持的选择器 */
.classname {
  color: red;
}

.classA, .classB {
  color: red;
}

/* ❌ 不支持的选择器 */
view, text {
  color: red;
}

.classA .classB {
  color: red;
}
```

## 样式单位

Mpx 转 RN 支持以下单位，部分单位在特定情况下存在使用限制。

### 数值类型单位

| 单位 | 支持情况 | 特殊说明 |
|------|---------|----------|
| `%` | ✅ 支持 | 百分比单位参考 [百分比单位说明](#百分比单位说明) |
| `px` | ✅ 支持 | 绝对像素单位 |
| `rpx` | ✅ 支持 | 响应式像素，根据屏幕宽度动态计算 |
| `vh` | ✅ 支持 | 视口高度的 1%，推荐配合自定义导航使用 |
| `vw` | ✅ 支持 | 视口宽度的 1% |

> **关于 vh 单位的说明**
>
> 在使用非自定义导航时，页面初次渲染计算出来的 `vh` 是屏幕高度，后续更新渲染使用实际可视区域高度。推荐使用此单位的页面使用自定义导航。
### 百分比单位说明

RN 原生较多属性不支持百分比（如 `font-size`、`translate` 等），但这些属性在编写 Web/小程序代码时使用较多，框架进行了抹平支持。

以下属性在 Mpx 输出 RN 时专门进行了百分比单位的适配：

#### 特殊的百分比计算规则

##### font-size

`font-size` 百分比计算依赖开发者传入的 `parent-font-size` 属性：

```html
<text parent-font-size="16" style="font-size: 120%;">文本内容</text>
```

> **⚠️ 注意事项**
>
> 当 `font-size` 设置为百分比时：
> - 未设置 `parent-font-size` 属性会报错
> - `parent-font-size` 属性值非数值会报错
> - 框架不会计算 `font-size`，直接返回原值

##### line-height

和 Web/小程序类似，当设置 `line-height: 1.2` 或 `line-height: 120%` 时，实际都按百分比计算。

`line-height` 的百分比计算基准是 `font-size` 的大小，所以设置 `line-height` 为数值或百分比时，要保证同时设置了 `font-size` 大小。

```css
.text {
  font-size: 16px;
  line-height: 1.5; /* 相当于 150% */
}
```

> **⚠️ 注意事项**
>
> 设置 `line-height` 时要注意区分有无单位：
> - `line-height: 12` 会按照 `line-height: 1200%` 来计算处理
> - `line-height: 12px` 会按照正常单位计算
##### 根据自身宽高计算百分比

`translateX`、`translateY`、`border-radius` 的百分比都是根据自身宽高来计算的。

```css
.self-based {
  transform: translateX(50%); /* 基于自身宽度 */
  transform: translateY(30%); /* 基于自身高度 */
  border-radius: 10%; /* 基于自身宽度 */
}
```

> **⚠️ 注意事项**
>
> - **版本要求**：RN 0.76+ 版本支持 `translateX`/`translateY` 百分比
> - **计算基准**：
>   - `translateX`、`border-radius` 基于节点的 `width` 计算
>   - `translateY` 基于节点的 `height` 计算
>   - `border-radius-*`（top/right/bottom/left）计算逻辑与 `border-radius` 一致
> - **生效时机**：需要在完成渲染后通过 `onLayout` 获取自身宽高，故属性设置在第一次 `onLayout` 后生效
> - **动画限制**：动画执行不会触发 `onLayout`，不建议在动画中使用这些属性的百分比

##### 根据父节点宽高计算百分比

除上述特殊规则外，`width`、`left`、`right`、`height`、`top`、`bottom`、`margin`、`padding` 等属性设置百分比时的计算基准都是父节点的宽高。

RN 原生支持这些属性的百分比设置，无需框架额外处理。

```css
.parent-based {
  width: 50%; /* 基于父节点宽度 */
  height: 80%; /* 基于父节点高度 */
  margin: 10%; /* 基于父节点宽度 */
}
```

**例外情况**：在 `calc()` 函数表达式中使用百分比，如 `width: calc(100% - 10px)`。

###### calc() 函数内的百分比使用方式

在 `calc()` 函数表达式内使用百分比时，需要开发者设置 `parent-width` 或 `parent-height` 属性：

- **基于父节点高度计算**：`height`、`top`、`bottom` 需要传入 `parent-height` 属性
- **基于父节点宽度计算**：`width`、`left`、`right` 需要传入 `parent-width` 属性

```html
<view parent-width="300" style="width: calc(100% - 20px);">内容</view>
<view parent-height="400" style="height: calc(80% + 10px);">内容</view>
```

> **💡 提示**
>
> 属性计算基准遵循：**纵向以高度为基准，横向以宽度为基准**
### 色值类型支持

支持以下颜色值格式：

| 格式类型 | 说明 | 示例 |
|----------|------|------|
| **Named Color** | 预定义颜色名称 | `red`、`blue`、`orange` |
| **Hex Color** | 十六进制颜色 | `#090`、`#009900`、`#090a` |
| **RGB/RGBA** | RGB/RGBA 函数 | `rgb(34, 12, 64)`、`rgba(34, 12, 64, 0.6)` |
| **HSL/HSLA** | HSL/HSLA 函数 | `hsl(30, 100%, 50%)`、`hsla(30, 100%, 50%, 0.6)` |
| **HWB** | HWB 函数 | `hwb(90 10% 10%)`、`hwb(90 10% 10% / 0.5)` |
| **Color Ints** | RN 特有格式 | `0xff00ff00` |

> **📖 参考文档**
>
> 更多颜色名称请参考：[React Native 颜色枚举值](https://reactnative.dev/docs/colors#named-colors)

#### 颜色值示例

```css
/* 预定义颜色名称 */
color: red;
color: orange;
color: tan;
color: rebeccapurple;

/* 十六进制颜色 */
color: #090;        /* 3位简写 */
color: #009900;     /* 6位完整 */
color: #090a;       /* 4位带透明度 */
color: #009900aa;   /* 8位带透明度 */

/* RGB/RGBA 函数 */
color: rgb(34, 12, 64);
color: rgba(34, 12, 64, 0.6);
color: rgb(34 12 64 / 0.6);      /* 新语法 */
color: rgba(34 12 64 / 0.3);     /* 新语法 */
color: rgb(34 12 64 / 60%);      /* 百分比透明度 */

/* HSL/HSLA 函数 */
color: hsl(30, 100%, 50%);
color: hsla(30, 100%, 50%, 0.6);
color: hsl(30 100% 50% / 0.6);   /* 新语法 */
color: hsla(30 100% 50% / 60%);  /* 百分比透明度 */

/* HWB 函数 */
color: hwb(90 10% 10%);
color: hwb(90 10% 10% / 0.5);
color: hwb(90deg 10% 10%);       /* 度数单位 */
color: hwb(1.5708rad 60% 0%);    /* 弧度单位 */
color: hwb(0.25turn 0% 40% / 50%); /* 圈数单位 */
```

## 文本样式继承

### 平台差异

| 平台 | 文本节点处理 | 样式设置 |
|------|-------------|----------|
| **Web/小程序** | `div`/`view` 可直接包裹文本 | 可在容器节点上设置文本样式 |
| **React Native** | 必须通过 `Text` 创建文本节点 | [文本样式属性](https://reactnative.dev/docs/text-style-props) 只能设置给 `Text` 节点 |

### Mpx 抹平机制

Mpx 框架抹平了平台差异：
- ✅ 可以使用 `view` 节点直接包裹文本
- ✅ 可以在 `view` 节点上设置文本样式，作用到直接子 `text` 节点

### 继承规则限制

受限于 [RN 内 text 的样式继承原则](https://reactnative.dev/docs/text#limited-style-inheritance)：

- 只有 `view` 节点下的**直接子** `text` 节点可以继承 `view` 节点上的文本样式
- `text` 节点之间可以相互继承样式

### 示例对比

```html
<!-- 示例代码 -->
<view class="wrapper">
   文本1
   <text class="content">文本2</text>
   <text class="content"><text>文本3</text></text>
   <view class="content">文本4</view>
   <view class="content"><view>文本5</view></view>
</view>
```

```css
.wrapper {
    font-size: 20px;
}
.content {
    text-align: right;
}
```

#### 渲染效果对比

| 文本 | Web/小程序 | React Native |
|------|------------|--------------|
| 文本1 | 20px，居右 | 20px |
| 文本2 | 20px，居右 | 20px，居右 |
| 文本3 | 20px，居右 | 20px，居右 |
| 文本4 | 20px，居右 | 居右 |
| 文本5 | 20px，居右 | 样式未生效 |

### 关键知识点

> **💡 重要说明**
>
> 1. **父子继承**：只有父级 `view` 节点的文本样式可以被子 `text` 节点继承
> 2. **自动包裹**：`view` 节点直接包裹文本等同于 `view > text > 文本`，Mpx 编译时会自动添加 `text` 节点
> 3. **多层继承**：多级 `text` 节点可实现文本样式的继承，如 `text > text > 文本`
## 简写样式属性

Mpx 对通过 `class` 类定义的样式会按照 RN 的样式规则进行编译处理，其中最重要的功能是将 RN 不支持的简写属性转换成 RN 支持的多属性结构。

### 支持的简写属性

| 属性类型 | 简写属性 |
|----------|----------|
| **文本相关** | `text-shadow`、`text-decoration` |
| **布局相关** | `flex`、`flex-flow` |
| **间距相关** | `margin`、`padding` |
| **背景相关** | `background` |
| **阴影相关** | `box-shadow` |
| **边框相关** | `border-radius`、`border-width`、`border-color`、`border` |
| **方向边框** | `border-top`、`border-right`、`border-bottom`、`border-left` |

### 使用示例

```css
/* 简写属性示例 */
.shorthand-example {
  /* 边距简写 */
  margin: 10px 20px;        /* 转换为 marginTop, marginRight, marginBottom, marginLeft */
  padding: 15px;            /* 转换为 paddingTop, paddingRight, paddingBottom, paddingLeft */
  
  /* 边框简写 */
  border: 1px solid red;    /* 转换为 borderWidth, borderStyle, borderColor */
  border-radius: 5px;       /* 转换为各个角的 borderRadius */
  
  /* 弹性布局简写 */
  flex: 1 0 auto;          /* 转换为 flexGrow, flexShrink, flexBasis */
}
```

### 重要限制

> **⚠️ 注意事项**
>
> **编译时 vs 运行时**
> - ✅ **class 类样式**：简写属性会在编译时转换
> - ❌ **style 属性**：简写属性不会在运行时转换，RN 不支持的简写属性无法使用
>
> **CSS 变量限制**
> - ❌ 简写属性不支持单个 `var()` 函数，编译时会报错并原样返回
> - ✅ 多个 `var()` 函数会按顺序赋值给各个属性
>
> ```css
> /* ❌ 错误用法 */
> .error {
>   margin: var(--spacing);  /* 会报错 */
> }
> 
> /* ✅ 正确用法 */
> .correct {
>   margin: var(--top) var(--right) var(--bottom) var(--left);
> }
> ```

## CSS 函数

在介绍具体的 CSS 函数前，先了解一下自定义属性的概念。

### 自定义属性（CSS 变量）

**自定义属性**（也称作 **CSS 变量** 或 **级联变量**）是带有前缀 `--` 的属性名，用于定义可重复使用的值。

#### 基本用法

```css
/* 定义自定义属性 */
:root {
  --main-color: #3498db;
  --secondary-color: #2ecc71;
  --spacing: 16px;
}

/* 使用自定义属性 */
.component {
  color: var(--main-color);
  background-color: var(--secondary-color);
  margin: var(--spacing);
}
```

#### 重要特性

> **📝 特性说明**
>
> - **级联继承**：自定义属性受 CSS 级联约束，从父级继承值
> - **大小写敏感**：自定义属性名区分大小写
> - **作用域**：可以在任何选择器中定义，具有作用域特性
### var() 函数

`var()` 函数可以插入自定义属性（CSS 变量）的值，用来代替属性值。

#### 语法

```css
var(<custom-property-name>, <fallback-value>?)
```

- **第一个参数**：要替换的自定义属性名称
- **第二个参数**：可选的回退值，当自定义属性无效时使用

#### 使用示例

```vue
<template>
  <view class="component">
    <view class="header">Header</view>
    <view class="content">Content</view>
    <view class="footer">Footer</view>
  </view>
</template>

<style>
.component {
  --content-color: #b58df1;
  --header-color: pink;
}

.component .header {
  background-color: var(--header-color, blue);    /* 使用 pink */
}

.component .content {
  background-color: var(--content-color, black);  /* 使用 #b58df1 */
}

.component .footer {
  background-color: var(--footer-color, black);   /* 使用 black（回退值） */
}
</style>
```

#### 渲染效果

| 元素 | 背景色 | 说明 |
|------|--------|------|
| Header | `pink` | 使用定义的 `--header-color` |
| Content | `#b58df1` | 使用定义的 `--content-color` |
| Footer | `black` | `--footer-color` 未定义，使用回退值 |

#### 注意事项

> **⚠️ 使用限制**
>
> - **回退值逗号**：回退值允许包含逗号，如 `var(--foo, red, blue)` 将 `red, blue` 作为完整回退值
> - **使用场景**：`var()` 函数只能作为属性值使用，不能用作属性名或选择器
> - **嵌套使用**：支持在回退值中嵌套其他 `var()` 函数
### calc() 函数

`calc()` 函数允许在声明 CSS 属性值时执行数学计算，使用表达式的结果作为最终值。

#### 语法

```css
calc(expression)
```

表达式采用标准数学运算法则，支持四则运算：`+`、`-`、`*`、`/`

#### 运算规则

| 运算符 | 要求 | 说明 |
|--------|------|------|
| `+`、`-` | **两边必须有空格** | 加法和减法运算 |
| `*`、`/` | **至少一边是数字** | 乘法和除法运算 |

> **⚠️ 重要提醒**
>
> - **乘法运算**：乘数中至少有一个必须是 `number`
> - **除法运算**：除数（`/` 右边的数）必须是 `number`
> - **空格要求**：`+` 和 `-` 运算符两边必须有空格
> - **单位支持**：所有能数值化的单位都支持 `calc()` 函数

#### 使用示例

```css
/* 基本用法 */
.basic {
  width: calc(100% - 80px);           /* 百分比减去固定值 */
  height: calc(50vh + 20px);          /* 视口单位加上固定值 */
  margin: calc(1rem * 2);             /* 倍数计算 */
  font-size: calc(16px / 2);          /* 除法计算 */
}

/* 与 CSS 变量结合使用 */
.variables {
  --base-width: 100px;
  --half-width: calc(var(--base-width) / 2);
  --quarter-width: calc(var(--half-width) / 2);
  
  width: var(--quarter-width);        /* 最终结果：25px */
}

/* 复杂表达式 */
.complex {
  font-size: calc(1.5rem + 3vw);      /* 响应式字体大小 */
  padding: calc(10px + 2%);           /* 固定值加百分比 */
}
```

#### 百分比计算

百分比在 `calc()` 中的计算逻辑详见 [百分比单位说明](#百分比单位说明)。

```css
/* 需要指定 parent-width 或 parent-height */
.percentage {
  width: calc(100% - 20px);   /* 需要 parent-width 属性 */
  height: calc(80% + 10px);   /* 需要 parent-height 属性 */
}
```
### env() 函数

`env()` 函数用于将系统定义的环境变量值插入到 CSS 中，主要用于处理设备的安全区域。

#### 语法

```css
env(<environment-variable>, <fallback-value>?)
```

- **第一个参数**：系统环境变量名称
- **第二个参数**：可选的回退值，当环境变量不可用时使用

#### 支持的环境变量

| 环境变量 | 说明 | 用途 |
|----------|------|------|
| `safe-area-inset-top` | 顶部安全距离 | 避开状态栏、刘海屏等 |
| `safe-area-inset-right` | 右侧安全距离 | 避开侧边区域 |
| `safe-area-inset-bottom` | 底部安全距离 | 避开 Home 指示器等 |
| `safe-area-inset-left` | 左侧安全距离 | 避开侧边区域 |

#### 使用示例

```css
/* 基本用法 */
.safe-area {
  padding-top: env(safe-area-inset-top, 20px);
  padding-right: env(safe-area-inset-right, 20px);
  padding-bottom: env(safe-area-inset-bottom, 20px);
  padding-left: env(safe-area-inset-left, 20px);
}

/* 简写形式 */
.safe-area-compact {
  padding: env(safe-area-inset-top, 20px) 
           env(safe-area-inset-right, 20px) 
           env(safe-area-inset-bottom, 20px) 
           env(safe-area-inset-left, 20px);
}

/* 与其他值组合 */
.header {
  height: calc(60px + env(safe-area-inset-top, 0px));
  padding-top: env(safe-area-inset-top, 0px);
}
```

#### env() vs var() 对比

| 特性 | `env()` | `var()` |
|------|---------|---------|
| **定义方式** | 系统定义 | 开发者自定义 |
| **作用域** | 全局生效 | 局部作用域 |
| **用途** | 系统环境适配 | 样式变量管理 |

## 使用原子类

> **🚧 开发中**
>
> 原子类功能正在开发中，敬请期待后续版本支持。

---

## 总结

通过以上介绍，我们了解了 Mpx 在 React Native 平台上的样式处理机制：

- ✅ **编译时优化**：自动转换和适配样式差异
- ✅ **运行时支持**：处理动态样式和 CSS 函数
- ✅ **跨平台一致性**：最大程度保持 Web/小程序的开发体验
- ✅ **性能考虑**：合理的编译时和运行时处理分工

在实际开发中，建议优先使用平台交集属性，合理利用框架提供的抹平能力，以获得最佳的开发体验和运行性能。