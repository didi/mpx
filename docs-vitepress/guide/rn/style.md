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
| `vh` | ✅ 支持 | 相对于视口的高度 |
| `vw` | ✅ 支持 | 相对视口的宽度 |

> **⚠️ vh 单位使用注意**
>
> **问题**：使用系统默认导航栏时，`vh` 的计算基准可能会发生变化
> - 页面首次加载：`100vh = 屏幕总高度`
> - 状态更新后：`100vh = 屏幕高度 - 导航栏高度`
>
> **影响**：可能导致布局在运行时突然变化
>
> **建议**：如需使用 `vh` 单位，推荐配合自定义导航栏使用，以确保计算基准始终一致
### 百分比单位说明

RN 原生较多属性不支持百分比，或对百分比的支持存在 bug（如 `font-size`、`translate` 等），但这些属性在编写 Web/小程序代码时使用较多，所以框架进行了抹平支持。

以下属性在 Mpx 输出 RN 时专门进行了百分比单位的适配：

#### 百分比计算规则

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
> - 若出现以上两种情况，框架不会计算 `font-size`，直接返回原值

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
> - **计算基准**：
>   - `translateX`、`border-radius` 基于节点的 `width` 计算
>   - `translateY` 基于节点的 `height` 计算
>   - `border-radius-*`（top/right/bottom/left）计算逻辑与 `border-radius` 一致
> - **生效时机**：需要在完成渲染后通过 `onLayout` 获取自身宽高，故属性设置在第一次 `onLayout` 后生效
> - **动画限制**：动画执行不会触发 `onLayout`，不建议在动画中使用这些属性的百分比

##### 根据父节点宽高计算百分比

除上述特殊规则外，`width`、`left`、`right`、`height`、`top`、`bottom`、`margin`、`padding` 等属性设置百分比时的计算基准都是父节点的宽高。RN 原生默认支持这些属性的百分比设置，无需框架额外处理。

**例外情况**：在 `calc()` 函数表达式中使用百分比，如 `width: calc(100% - 10px)`，这种情况是需要框架额外处理的。

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

### 继承规则

受限于 [RN 内 text 的样式继承原则](https://reactnative.dev/docs/text#limited-style-inheritance)，Mpx 的文本样式继承遵循以下规则：
>
> 1. **view → text 继承**：只有 `view` 节点下的**直接子** `text` 节点可以继承 `view` 节点上的文本样式
> 2. **text 嵌套继承**：父级 `text` 节点的样式可以被嵌套的子 `text` 节点继承
> 3. **自动包裹**：`view` 节点直接包裹文本时，Mpx 编译时会自动添加 `text` 节点包裹文本

### 示例

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

### 示例

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

### 使用限制

> **⚠️ 注意事项**
>
> **编译时 vs 运行时**
> - ✅ **class 类样式**：考虑到运行时转化的性能开销问题，简写属性只会在编译时转换
> - ❌ **style 属性**：简写属性不会在运行时转换，RN 不支持的简写属性无法使用
>
> **CSS 变量限制**
> - ❌ 简写属性不支持单个 `var()` 函数，编译时会报错并原样返回
> - ✅ 多个 `var()` 函数会按顺序赋值给各个属性
>
> ```css
> /* ❌ 错误用法 */
> .error {
>   margin: var(--spacing);  /* 会报错，可能会导致 RN 运行时错误 */
> }
> 
> /* ✅ 正确用法 */
> .correct {
>   margin: var(--top) var(--right) var(--bottom) var(--left);
> }
> ```

## CSS 函数

### var() 函数

`var()` 函数可以插入自定义属性（CSS 变量）的值，用来代替属性值。

```css
/* 定义变量：以 -- 开头 */
:root {
  --main-color: #3498db;
  --spacing: 16px;
}

/* 使用变量：通过 var() 函数 */
.component {
  color: var(--main-color);
  margin: var(--spacing);
}
```

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

.header {
  background-color: var(--header-color, blue);    /* 使用 pink */
}

.content {
  background-color: var(--content-color, black);  /* 使用 #b58df1 */
}

.footer {
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
> - **回退值逗号**：回退值允许包含逗号，如 `var(--foo, red, blue)` 会将 `red, blue` 作为完整回退值（在第一个逗号之后到函数结尾前的值都会被认为是回退值）
> - **使用场景**：`var()` 函数只能作为属性值使用，不能用作属性名或选择器
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

> **⚠️ 注意**
>
> - **乘法运算**：乘数中至少有一个必须是 `number`
> - **除法运算**：除数（`/` 右边的数）必须是 `number`
> - **空格要求**：`+` 和 `-` 运算符两边必须有空格，* 和 / 这两个运算符前后不需要空格，但考虑到统一性，仍然推荐加上空格
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
```

#### env() vs var() 对比

| 特性 | `env()` | `var()` |
|------|---------|---------|
| **定义方式** | 系统定义 | 开发者自定义 |
| **作用域** | 全局生效 | 局部作用域 |
| **用途** | 系统环境适配 | 样式变量管理 |

## 原子类

> 原子类功能正在开发中，敬请期待后续版本支持。


## 样式属性参考

以下是 Mpx 转 RN 支持的样式属性详细说明。

### position

设置元素的定位方式。

**值类型**：`relative` | `absolute` | `fixed`（默认 `relative`）

```css
position: absolute;
top: 10px;
```

### top / right / bottom / left

设置元素在不同方向的偏移量。

**值类型**：`number`，支持[所有数值单位](#数值类型单位)

```css
position: relative;
top: 10%;
left: 20px;
```

### z-index

控制元素的堆叠覆盖顺序。

**值类型**：`number`（纯数值，无单位）

```css
position: absolute;
z-index: 10;
```

### display

设置元素的布局方式。

**值类型**：`flex` | `none`

> **⚠️ RN 布局限制**
>
> - 仅支持 `flex` 布局，不支持 `block`、`grid`、`table` 等
> - Text 节点默认为行内布局

```css
display: flex; /* 弹性布局（默认） */
display: none; /* 隐藏元素 */
```

### opacity

设置元素的不透明度。

**值类型**：`number`（0-1，0为完全透明，1为完全不透明）

> **⚠️ 注意**：RN 中设置 `opacity: 0` 的元素不响应触摸事件

```css
opacity: 1;   /* 完全不透明 */
opacity: 0.6; /* 半透明 */
opacity: 0;   /* 完全透明 */
```

### overflow

控制元素溢出时的行为。

**值类型**：`visible` | `hidden` | `scroll`

```css
overflow: visible; /* 显示溢出内容 */
overflow: hidden;  /* 隐藏溢出内容 */
overflow: scroll;  /* 滚动查看溢出内容 */
```

### pointer-events

控制元素是否响应触摸事件。

**值类型**：`auto` | `none` | `box-none` | `box-only`

> **💡 RN 特有值**
>
> - `box-none`：当前元素不响应，但子元素可响应
> - `box-only`：当前元素响应，但子元素不响应

```css
pointer-events: auto;     /* 正常响应事件 */
pointer-events: none;     /* 不响应事件 */
pointer-events: box-none; /* 仅 RN 支持 */
```

### justify-content

设置主轴方向的对齐方式。

**值类型**：`flex-start` | `flex-end` | `center` | `space-between` | `space-around` | `space-evenly`

```css
justify-content: flex-start;    /* 起始对齐（默认） */
justify-content: center;        /* 居中对齐 */
justify-content: space-between; /* 两端对齐 */
```

### align-items

设置交叉轴方向的对齐方式。

**值类型**：`flex-start` | `flex-end` | `center` | `stretch` | `baseline`

```css
align-items: stretch;    /* 拉伸填充（默认） */
align-items: center;     /* 居中对齐 */
align-items: flex-start; /* 起始对齐 */
```

### align-content

设置多行内容在交叉轴的对齐方式。

**值类型**：`flex-start` | `flex-end` | `center` | `stretch` | `space-between` | `space-around` | `space-evenly`

```css
align-content: flex-start;    /* 起始对齐 */
align-content: space-between; /* 行间等距分布 */
```

### align-self

设置单个子元素在交叉轴的对齐方式。

**值类型**：`auto` | `flex-start` | `flex-end` | `center` | `stretch` | `baseline`

```css
align-self: auto;      /* 继承父元素 align-items */
align-self: center;    /* 居中对齐 */
align-self: flex-end;  /* 末尾对齐 */
```

### flex-direction

设置主轴方向。

**值类型**：`row` | `row-reverse` | `column` | `column-reverse`

```css
flex-direction: row;          /* 水平排列（默认） */
flex-direction: column;       /* 垂直排列 */
flex-direction: row-reverse;  /* 水平反向排列 */
```

### flex-wrap

设置是否允许换行。

**值类型**：`nowrap` | `wrap` | `wrap-reverse`

> **⚠️ 注意**：当 `flex-wrap: wrap` 时，`align-items: center` 可能不生效

```css
flex-wrap: nowrap; /* 不换行（默认） */
flex-wrap: wrap;   /* 允许换行 */
```

### flex-grow

设置元素的放大系数。

**值类型**：`number`（≥ 0，默认 0）

```css
flex-grow: 0; /* 不放大（默认） */
flex-grow: 1; /* 等比放大 */
flex-grow: 2; /* 放大系数为 2 */
```

### flex-shrink

设置元素的收缩系数。

**值类型**：`number`（≥ 0，默认 0）

```css
flex-shrink: 0; /* 不收缩（默认） */
flex-shrink: 1; /* 允许收缩 */
```

### flex-basis

设置元素在主轴上的初始大小。

**值类型**：`auto` | `number`，支持[所有数值单位](#数值类型单位)

> **⚠️ 优先级**：`flex-basis` 优先级高于 `width/height`

```css
flex-basis: auto; /* 根据内容决定（默认） */
flex-basis: 100px; /* 固定初始大小 */
flex-basis: 50%;   /* 百分比大小 */
```

### flex

`flex-grow`、`flex-shrink`、`flex-basis` 的简写属性。

**值类型**：`none` | `auto` | `initial` | `<flex-grow>` | `<flex-grow> <flex-shrink>` | `<flex-grow> <flex-basis>` | `<flex-grow> <flex-shrink> <flex-basis>`

```css
flex: 1;        /* flex: 1 1 0 */
flex: auto;     /* flex: 1 1 auto */
flex: none;     /* flex: 0 0 auto */
flex: 2 1 100px; /* grow: 2, shrink: 1, basis: 100px */
```

### flex-flow

`flex-direction` 和 `flex-wrap` 的简写属性。

**值类型**：`<flex-direction>` | `<flex-wrap>` | `<flex-direction> <flex-wrap>`

```css
flex-flow: row;         /* 仅设置方向 */
flex-flow: row nowrap;  /* 方向 + 换行 */
```

### gap / row-gap / column-gap

设置行列间距。

**值类型**：`number`，支持[所有数值单位](#数值类型单位)

```css
gap: 16px;          /* 行列间距都是 16px */
gap: 20px 10px;     /* 行间距 20px，列间距 10px */
row-gap: 20px;      /* 仅行间距 */
column-gap: 10px;   /* 仅列间距 */
```

### width / height

设置元素的宽度和高度。

**值类型**：`auto` | `number`，支持[所有数值单位](#数值类型单位)

```css
width: auto;  /* 自动宽度 */
width: 100px; /* 固定宽度 */
width: 50%;   /* 百分比宽度 */
```

### max-width / max-height / min-width / min-height

设置元素的最大/最小尺寸。

**值类型**：`number`，支持[所有数值单位](#数值类型单位)

```css
max-width: 500px;  /* 最大宽度 */
min-height: 100px; /* 最小高度 */
```

### aspect-ratio

设置元素的宽高比。

**值类型**：`auto` | `number` | `<width> / <height>`

```css
aspect-ratio: 1;       /* 正方形 */
aspect-ratio: 16 / 9;  /* 16:9 比例 */
aspect-ratio: auto;    /* 自动比例 */
```

### margin

设置外边距。

**值类型**：`auto` | `number`，支持[所有数值单位](#数值类型单位)

```css
margin: 10px;               /* 四边相同 */
margin: 10px 20px;          /* 上下 | 左右 */
margin: 10px 20px 15px;     /* 上 | 左右 | 下 */
margin: 10px 20px 15px 5px; /* 上 | 右 | 下 | 左 */
```

### margin-top / margin-right / margin-bottom / margin-left

设置单边外边距。

**值类型**：`auto` | `number`，支持[所有数值单位](#数值类型单位)

```css
margin-top: 10px;    /* 上边距 */
margin-left: auto;   /* 左边距自动 */
```

### padding

设置内边距。

**值类型**：`number`，支持[所有数值单位](#数值类型单位)

```css
padding: 10px;               /* 四边相同 */
padding: 10px 20px;          /* 上下 | 左右 */
padding: 10px 20px 15px;     /* 上 | 左右 | 下 */
padding: 10px 20px 15px 5px; /* 上 | 右 | 下 | 左 */
```

### padding-top / padding-right / padding-bottom / padding-left

设置单边内边距。

**值类型**：`number`，支持[所有数值单位](#数值类型单位)

```css
padding-top: 10px;    /* 上内边距 */
padding-left: 20px;   /* 左内边距 */
```

### border

边框的简写属性。

**值类型**：`<border-width>` | `<border-style>` | `<border-color>`

```css
border: 1px solid red;    /* 宽度 | 样式 | 颜色 */
border: 2px dotted;       /* 宽度 | 样式 */
border: 1px;              /* 仅宽度 */
```

### border-width

设置边框宽度。

**值类型**：`number`，支持[所有数值单位](#数值类型单位)

```css
border-width: 1px;                /* 四边相同 */
border-width: 1px 2px;            /* 上下 | 左右 */
border-width: 1px 2px 3px 4px;    /* 上 | 右 | 下 | 左 */
```

### border-color

设置边框颜色。

**值类型**：`color`，参考[色值类型支持](#色值类型支持)

```css
border-color: red;              /* 四边相同 */
border-color: red blue;         /* 上下 | 左右 */
border-color: red blue green;   /* 上 | 左右 | 下 */
```

### border-style

设置边框样式。

**值类型**：`solid` | `dotted` | `dashed`

> **⚠️ 限制**：RN 不支持单独设置各边的样式，只能整体设置

```css
border-style: solid;  /* 实线 */
border-style: dotted; /* 点线 */
border-style: dashed; /* 虚线 */
```

### border-radius

设置圆角半径。

**值类型**：`number`，支持[所有数值单位](#数值类型单位)

```css
border-radius: 5px;           /* 四角相同 */
border-radius: 5px 10px;      /* 对角线 */
border-radius: 5px 10px 15px 20px; /* 左上 | 右上 | 右下 | 左下 */
```

### border-top / border-right / border-bottom / border-left

单边边框的简写属性。

**值类型**：`<border-width>` | `<border-style>` | `<border-color>`

```css
border-top: 1px solid red;    /* 上边框 */
border-left: 2px dotted blue; /* 左边框 */
```

### background

背景的简写属性。

**值类型**：`<background-image>` | `<background-color>` | `<background-size>` | `<background-repeat>` | `<background-position>`

> **⚠️ 限制**：仅支持 `view` 元素

```css
background: url("image.jpg") no-repeat center;
background: linear-gradient(45deg, red, blue);
background: #f0f0f0;
```

### background-color

设置背景颜色。

**值类型**：`color`，参考[色值类型支持](#色值类型支持)

```css
background-color: red;
background-color: #ff0000;
background-color: rgba(255, 0, 0, 0.5);
```

### background-image

设置背景图片或渐变。

**值类型**：`url()` | `linear-gradient()`

> **⚠️ 渐变限制**
>
> - 不支持 `turn`、`px` 单位，仅支持百分比
> - 需要通过 `enable-background` 属性开启支持

```css
background-image: url("https://example.com/image.jpg");
background-image: linear-gradient(45deg, blue, red);
background-image: linear-gradient(to right, blue 0%, red 100%);
```

### background-size

设置背景图片大小。

**值类型**：`cover` | `contain` | `auto` | `number`

```css
background-size: cover;    /* 覆盖容器 */
background-size: contain;  /* 完整显示 */
background-size: 50% 25%;  /* 宽度 高度 */
```

### background-repeat

设置背景图片重复方式。

**值类型**：`no-repeat`

> **⚠️ 限制**：RN 仅支持 `no-repeat`

```css
background-repeat: no-repeat;
```

### background-position

设置背景图片位置。

**值类型**：`center` | `left` | `right` | `top` | `bottom` | `number`

```css
background-position: center;      /* 居中 */
background-position: 10px 20px;   /* x y 坐标 */
background-position: right 10px bottom 10px; /* 右下角偏移 */
```

### box-shadow

设置盒阴影。

**值类型**：`<offset-x> <offset-y> <blur-radius> <color>`

> **⚠️ 平台差异**
>
> - iOS：支持 `shadowOffset`、`shadowRadius`、`shadowColor`
> - Android：仅支持 `shadowColor`
> - 与 `overflow: hidden` 同时使用时可能不显示

```css
box-shadow: 0 2px 4px rgba(0, 0, 0, 0.2);    /* x y 模糊 颜色 */
box-shadow: 2px 2px 8px 1px rgba(0, 0, 0, 0.3); /* 扩散半径会被忽略 */
```

### color

设置文本颜色。

**值类型**：`color`，参考[色值类型支持](#色值类型支持)

> **💡 提示**：遵循[文本样式继承规则](#文本样式继承)

```css
color: red;
color: #ff0000;
color: rgba(255, 0, 0, 0.8);
```

### font-family

设置字体族。

**值类型**：`string`

> **⚠️ 限制**
>
> - 仅支持设置单一字体
> - 不支持字体文件引入

```css
font-family: PingFangSC-Regular;
```

### font-size

设置字体大小。

**值类型**：`number`，支持[所有数值单位](#数值类型单位)

> **💡 百分比计算**：需要设置 `parent-font-size` 属性

```css
font-size: 16px;
font-size: 1.2rem;
font-size: 120%; /* 需要 parent-font-size */
```

### font-weight

设置字体粗细。

**值类型**：`normal` | `bold` | `100` | `200` | `300` | `400` | `500` | `600` | `700` | `800` | `900`

> **⚠️ 注意**：数值类型在 RN 中是字符串，非数值可能导致异常

```css
font-weight: normal; /* 400 */
font-weight: bold;   /* 700 */
font-weight: 600;
```

### font-style

设置字体样式。

**值类型**：`normal` | `italic`

```css
font-style: normal;
font-style: italic;
```

### line-height

设置行高。

**值类型**：`number`，支持[所有数值单位](#数值类型单位)

> **💡 百分比/倍数**：基于 `font-size` 计算

```css
line-height: 20px;   /* 固定行高 */
line-height: 1.5;    /* 相对倍数 */
line-height: 150%;   /* 百分比 */
```

### text-align

设置文本对齐方式。

**值类型**：`left` | `right` | `center` | `justify`

```css
text-align: left;    /* 左对齐 */
text-align: center;  /* 居中对齐 */
text-align: justify; /* 两端对齐 */
```

### vertical-align

设置行内文本的垂直对齐方式（仅 Android）。

**值类型**：`auto` | `top` | `bottom` | `middle`

> **⚠️ 平台限制**：仅 Android 支持

```css
vertical-align: middle; /* 垂直居中 */
vertical-align: top;    /* 顶部对齐 */
```

### text-decoration

文本装饰线的简写属性。

**值类型**：`<text-decoration-line>` | `<text-decoration-style>` | `<text-decoration-color>`

> **⚠️ 平台差异**：`style` 和 `color` 仅 iOS 支持

```css
text-decoration: underline;           /* 下划线 */
text-decoration: line-through;        /* 删除线 */
text-decoration: underline dotted red; /* 样式 + 颜色（iOS） */
```

### text-transform

设置文本大小写转换。

**值类型**：`none` | `uppercase` | `lowercase` | `capitalize`

```css
text-transform: uppercase;  /* 大写 */
text-transform: lowercase;  /* 小写 */
text-transform: capitalize; /* 首字母大写 */
```

### letter-spacing

设置字符间距。

**值类型**：`number`，支持[所有数值单位](#数值类型单位)

```css
letter-spacing: 2px;   /* 字符间距 2px */
letter-spacing: 0.1em; /* 相对间距 */
```

### text-shadow

设置文本阴影。

**值类型**：`<offset-x> <offset-y> <blur-radius> <color>`

```css
text-shadow: 1px 1px 2px rgba(0, 0, 0, 0.5); /* x y 模糊 颜色 */
text-shadow: 2px 2px #000;                    /* x y 颜色 */
```

### font-variant

设置字体变体。

**值类型**：`small-caps` | `oldstyle-nums` | `lining-nums` | `tabular-nums` | `proportional-nums`

```css
font-variant: small-caps;     /* 小型大写字母 */
font-variant: tabular-nums;   /* 等宽数字 */
```

### direction

设置文本书写方向。

**值类型**：`ltr` | `rtl` | `inherit`

```css
direction: ltr; /* 从左到右 */
direction: rtl; /* 从右到左 */
```

### user-select

控制用户是否可以选择文本。

**值类型**：`auto` | `text` | `none` | `contain` | `all`

```css
user-select: none; /* 禁止选择 */
user-select: text; /* 允许选择 */
```

### transform

设置元素变换。

**值类型**：`string` | `array`（仅 RN）

```css
/* CSS 字符串格式 */
transform: translateX(50px) rotate(45deg);
transform: scale(1.2) skewX(10deg);

/* RN 数组格式 */
transform: [{translateX: 50}, {rotate: '45deg'}];
```

### transform-origin

设置变换原点。

**值类型**：`<x-position>` | `<y-position>` | `<z-position>`

```css
transform-origin: center;          /* 中心点 */
transform-origin: 50% 50%;         /* 百分比 */
transform-origin: 10px 20px 30px;  /* 3D 坐标 */
```

### backface-visibility

设置背面可见性（仅支持 view 节点）。

**值类型**：`visible` | `hidden`

```css
backface-visibility: hidden; /* 背面隐藏 */
```

### object-fit

设置图像调整方式（仅支持view 节点）

**值类型**：`cover` | `contain` | `fill` | `scale-down`

```css
object-fit: cover;   /* 覆盖填充 */
object-fit: contain; /* 完整显示 */
```
