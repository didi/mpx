
# RN 与小程序平台的样式能力差异

## 1. 选择器支持对比

| 选择器类型 | RN 平台 | 小程序平台 |
|-----------|---------|-----------|
| 单类选择器 `.class` | ✅ | ✅ |
| `page` 选择器 | ✅ | ✅ |
| `:host` 选择器 | ✅ | ✅ |
| ID 选择器 `#id` | ❌ | ✅ |
| 标签选择器 `view` | ❌ | ✅ |
| 后代选择器 `.a .b` | ❌ | ✅ |
| 子选择器 `.a > .b` | ❌ | ✅ |
| 伪类选择器 `:hover` | ❌ | ✅ |
| 伪元素选择器 `::before` | ❌ | ✅ |
| 属性选择器 `[type]` | ❌ | ✅ |
| 组合选择器 `.a.b` | ❌ | ✅ |

**关键差异：**
- RN 平台仅支持单类选择器、`page` 选择器和 `:host` 选择器
- 小程序平台支持完整的 CSS 选择器

## 2. CSS 属性支持对比

| 属性类别 | RN 平台 | 小程序平台 |
|---------|---------|-----------|
| 基础布局（Flexbox） | ✅ 支持 | ✅ 完整支持 |
| Grid 布局 | ⚠️ [存在兼容方案](#42-避免使用-Grid-布局) | ✅ 部分平台支持 |
| Float 布局 | ⚠️ [存在兼容方案](#43-避免使用-Float-布局) | ✅ 完整支持 |
| 隐藏（display: none） | ⚠️ [存在兼容方案](#6-隐藏元素) | ✅ 完整支持 |
| 定位（position） | ✅ relative, absolute, fixed | ✅ 完整支持（含 sticky） |
| 层级（z-index） | ✅ 支持 | ✅ 完整支持 |
| 垂直对齐（vertical-align） | ⚠️ iOS 不支持 | ✅ 完整支持 |
| 尺寸（width/height） | ✅ 长度单位（px, rpx, vw, vh）, %, auto | ✅ 完整支持 |
| 极值尺寸（min/max-*） | ✅ 长度单位（px, rpx, vw, vh）, %, auto | ✅ 完整支持 |
| 间距（margin/padding） | ✅ 长度单位（px, rpx, vw, vh）, %, auto | ✅ 完整支持 |
| 边框宽度（border-width） | ✅ 支持 | ✅ 完整支持 |
| 边框颜色（border-color） | ✅ 支持 | ✅ 完整支持 |
| 边框样式（border-style） | ✅ solid, dotted, dashed | ✅ 完整支持 |
| 边框圆角（border-radius） | ⚠️ 仅支持单值 | ✅ 完整支持 |
| 文本颜色（color） | ✅ 支持 | ✅ 完整支持 |
| 字体（font-*） | ✅ size, weight, style, family | ✅ 完整支持 |
| 文本对齐（text-align） | ✅ left, right, center, justify | ✅ 完整支持 |
| 行高（line-height） | ⚠️ 部分支持 | ✅ 完整支持 |
| 文本装饰（text-decoration） | ✅ text-decoration-line | ✅ 完整支持 |
| 文本转换（text-transform） | ✅ uppercase, lowercase, capitalize | ✅ 完整支持 |
| 文本溢出（text-overflow） | ⚠️ [存在兼容方案](#5-文本溢出处理) | ✅ 完整支持 |
| 空白处理（white-space） | ⚠️ [存在兼容方案](#5-文本溢出处理) | ✅ 完整支持 |
| CSS 动画（@keyframes） | ❌ 暂不支持 | ✅ 完整支持 |
| CSS 过渡（transition） | ⚠️ 部分支持 | ✅ 完整支持 |
| 变换（transform） | ⚠️ 部分支持 | ✅ 完整支持 |
| 变换原点（transform-origin） | ✅ 支持 | ✅ 完整支持 |
| 溢出（overflow） | ✅ visible, hidden, scroll | ✅ 完整支持 |
| 透明度（opacity） | ✅ 支持 | ✅ 完整支持 |
| 阴影（box-shadow） | ✅ 支持 | ✅ 完整支持 |
| 滤镜（filter）| ✅ brightness, opacity | ✅ 部分平台支持 |
| 背景颜色（background-color） | ✅ 支持 | ✅ 完整支持 |
| 背景图（background-image） | ✅ url(), linear-gradient() | ✅ 完整支持 |
| 背景图尺寸（background-size） | ✅ contain, cover, auto, 数值 | ✅ 完整支持 |
| 背景图重复（background-repeat） | ⚠️ 仅支持 no-repeat | ✅ 完整支持 |
| 背景图定位（background-position） | ✅ 支持 | ✅ 完整支持 |
| 多重背景 | ❌ 不支持 | ✅ 完整支持 |
| 渐变背景 | ✅ linear-gradient | ✅ 完整支持 |

**RN 平台特有限制：**
- **不支持的属性**：`caret-color`、`font-variant-*`（如 `font-variant-caps` 等）
- **transition 限制**：不支持 `transition-property: all` 和 `transition: all ...`
- **background 限制**：除 `background-color` 外仅 `view` 组件支持；`background-repeat` 仅支持 `no-repeat`
- **transform 限制**：不支持 `translateZ`、`scaleZ`、`translate3d`、`scale3d`、`rotate3d`、`matrix3d`
- **line-height 限制**：在 RN 与小程序平台中表现存在差异，不能用于设置文字垂直居中，如需设置文字垂直居中可使用 `align-items: center` 等布局属性替代

## 3. 单位处理对比

| 单位 | RN 平台 | 小程序平台 |
|-----|---------|-----------|
| rpx | ✅ 运行时转换 | ✅ 原生支持 |
| px | ✅ 直接转换为数值 | ✅ 物理像素 |
| % | ✅ 字符串形式 | ✅ 百分比 |
| vw/vh | ✅ 运行时转换 | ✅ 视口单位 |
| rem | ❌ | ✅ 相对单位 |
| em | ❌ | ✅ 相对单位 |
| hairlineWidth | ✅ RN 特有 | ❌ |

**转换差异：**
- RN 平台在运行时计算 rpx、vw、vh
- RN 平台的 px 会转换为无单位数值

## 4. 样式格式对比

| 特性 | RN 平台 | 小程序平台 |
|-----|---------|-----------|
| 样式编写 | CSS 语法 | CSS 语法（WXSS） |
| 样式文件 | `.mpx` 文件中的 `<style>` | `.wxss` 文件 |
| 媒体查询 | ✅ 有限支持（width/min-width/max-width，单位仅支持 px） | ✅ 支持 |
| CSS 变量 | ✅ 支持 | ✅ 支持 |

**示例对比：**

两个平台都使用相同的 CSS 语法编写样式：

```css
/* 源码 */
.container {
  background-color: #fff;
  padding-top: 20rpx;
}
```

开发者无需关心平台差异，框架会自动处理样式的平台适配。

## 5. 简写属性对比

| 简写属性 | RN 平台 | 小程序平台 |
|---------|---------|-----------|
| margin | ✅ 自动展开 | ✅ 原生支持 |
| padding | ✅ 自动展开 | ✅ 原生支持 |
| border | ✅ 自动展开 | ✅ 原生支持 |
| border-radius | ✅ 自动展开 | ✅ 原生支持 |
| flex | ✅ 自动展开 | ✅ 原生支持 |
| background | ⚠️ 部分支持 | ✅ 完整支持 |
| font | ❌ | ✅ 完整支持 |

**RN 平台展开示例：**
```css
/* 输入 */
.box {
  margin: 10rpx 20rpx;
}

/* RN 平台展开 */
{
  marginTop: 10,
  marginRight: 20,
  marginBottom: 10,
  marginLeft: 20
}

/* 小程序平台保持 */
.box {
  margin: 10rpx 20rpx;
}
```

**RN 平台特有限制：**
- 简写属性在编译时展开，因此 `style` 内联样式中不支持使用简写属性，仅在 `class` 类样式定义中支持
