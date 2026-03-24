# 样式行注释规则

当使用条件编译包裹 RN 平台不支持的样式时，如果某个 class 选择器内**所有样式属性行都变成注释状态**，则应将 class 选择器行也一起注释掉，避免输出无效的空 class。

## 规则说明

使用条件编译指令（`@mpx-if` / `@mpx-else` / `@mpx-endif`）包裹不兼容 RN 的样式时，需要注意选择器和样式的注释层级关系。

## 推荐做法

### 将 class 选择器行也包裹在条件编译注释内

**❌ 避免：**
```css
.invisible
  /* @mpx-if (!__ISRN__) */
  visibility hidden
  /* @mpx-endif */
```

**✅ 推荐：**
```css
/* @mpx-if (!__ISRN__) */
.invisible
  visibility hidden
/* @mpx-endif */
```

### 原因说明

1. **避免无效输出**：当 class 选择器未被注释而所有样式属性都被条件编译排除时，会在 RN 输出产物中产生空的 class 定义，这是不必要的冗余代码。

2. **条件编译指令正常处理**：条件编译指令（`@mpx-if` / `@mpx-endif`）可以被 Mpx 正常识别和处理，而被注释的 class 选择器和样式内容在 CSS 注释中不会生效。

3. **保持产物整洁**：RN 平台的输出产物中不会包含被注释掉的 class 和样式规则。

## 多行样式属性的处理

当一个 class 包含多个不兼容 RN 的样式属性时：

```css
/* @mpx-if (!__ISRN__) */
.animation-box
    animation slideIn 0.5s ease-in-out
    animation-delay 0.2s
/* @mpx-endif */
```

整个 class 块都被条件编译包裹，确保 RN 平台完全排除这些样式。

## 混合兼容样式的处理

当一个 class 同时包含兼容和不兼容 RN 的样式时，只对不兼容的部分进行条件编译：

```css
/* RN 使用 flex 布局隐藏 */
.mask
    /* @mpx-if (!__ISRN__) */
    display none
    /* @mpx-endif */
    /* RN 使用 flex:0 隐藏 */
    flex 0
    width 0
    height 0
```
