# RN boxSizing 默认行为对齐方案

## 背景与问题

RN 的盒模型默认值为 `border-box`，而小程序与 Web 默认值为 `content-box`。在 Mpx 输出 RN 时，如果业务没有显式声明 `box-sizing`，设置了固定 `width` / `height` 的节点会把 `padding` 和 `border` 计算进尺寸内，表现与小程序 / Web 不一致。

典型差异：

```css
.box {
  width: 100px;
  height: 100px;
  padding: 10px;
  border-width: 1px;
}
```

小程序 / Web 下默认外部占位为 `122px * 122px`；RN 默认 `border-box` 下外部占位仍为 `100px * 100px`。该差异会影响页面布局、图片默认尺寸、表单控件外层容器、自定义组件根节点等所有依赖盒模型的场景。

目标是在 RN 产物中将未显式声明 `box-sizing` 的 Mpx 节点默认行为调整为 `content-box`，同时保留业务显式设置 `box-sizing: border-box` 的能力。

## 现状分析

RN 样式主要经过两段处理：

1. 编译阶段：`packages/webpack-plugin/lib/react/style-helper.js` 解析 `<style>`，生成 className 到样式对象的映射。当前 `packages/webpack-plugin/lib/platform/style/wx/index.js` 已允许 `box-sizing: border-box | content-box`，并会转换为 `boxSizing`。
2. 运行时阶段：模板上的 `class` / `style` 统一编译为 `this.__getStyle(...)`，组件侧通过 `useTransformStyle` 处理变量、单位、百分比、`position: fixed` 等逻辑后传给 RN 原生组件。

多数内建组件的用户样式都会进入 `useTransformStyle`，例如 `mpx-view`、`mpx-image`、`mpx-text`、`mpx-button`、`mpx-scroll-view`、`mpx-input` 等。少数组件如 `mpx-simple-view`、`mpx-simple-text`、`mpx-inline-text` 直接透传 `props.style`，需要单独兜住。

不推荐在编译阶段给每条 class 注入默认 `boxSizing`：

1. 只能覆盖 class 样式，无法覆盖仅使用内联 `style` 或完全无样式的节点。
2. 动态 style、externalClasses、原生 style array 等入口仍需要运行时处理。
3. 默认行为属于 RN 运行时平台差异，集中在运行时抹平更符合当前 `useTransformStyle` 的职责。

## 推荐方案

在 RN runtime 样式处理层统一提供默认盒模型：

```ts
export const DEFAULT_BOX_SIZING_STYLE = {
  boxSizing: 'content-box'
}

export function applyDefaultBoxSizing (style: Record<string, any> = {}) {
  if (style.boxSizing === undefined) {
    style.boxSizing = DEFAULT_BOX_SIZING_STYLE.boxSizing
  }
  return style
}
```

核心规则：

1. 未显式声明 `boxSizing` 时，补 `content-box`。
2. 显式声明 `boxSizing: 'border-box'` 或 `boxSizing: 'content-box'` 时不覆盖。
3. 只对 Mpx 暴露给业务的节点根样式生效，不全局 patch RN，也不强行改内建组件内部用于绘制控件的小节点，降低对现有内部布局的影响。

### 1. 在 `useTransformStyle` 中注入默认值

文件：`packages/webpack-plugin/lib/runtime/components/react/utils.tsx`

在 `useTransformStyle` 完成 `normalStyle` 的 var / env / percent / calc / position / transform 处理后、return 之前调用：

```ts
applyDefaultBoxSizing(normalStyle)
```

这样所有走 `useTransformStyle` 的组件都会得到统一默认值，并且合并顺序稳定：

```ts
const styleObj = extendObject({}, defaultStyle, style)
// useTransformStyle(styleObj) 内部只在 normalStyle.boxSizing === undefined 时补默认值
```

业务显式样式优先级不变：

```css
.box {
  box-sizing: border-box;
}
```

最终仍输出：

```ts
{ boxSizing: 'border-box' }
```

### 2. 补齐直接透传样式的简单组件

以下组件未经过 `useTransformStyle`，需要在传给 RN 原生组件前补默认值：

1. `packages/webpack-plugin/lib/runtime/components/react/mpx-simple-view.tsx`
2. `packages/webpack-plugin/lib/runtime/components/react/mpx-simple-text.tsx`
3. `packages/webpack-plugin/lib/runtime/components/react/mpx-inline-text.tsx`

建议复用同一个 helper，避免各组件散落默认值：

```ts
style: applyDefaultBoxSizing(extendObject({}, innerStyle))
```

对 text 类组件也补默认值，原因是 RN `Text` 同样可能被设置 `width` / `height` / `padding` / `borderWidth`，小程序 / Web 默认盒模型仍应一致。

### 3. 保持编译侧显式属性支持

文件：`packages/webpack-plugin/lib/platform/style/wx/index.js`

当前已支持：

```js
'box-sizing': ['border-box', 'content-box']
```

本方案不需要调整属性校验逻辑，仅需确认以下入口都能保留业务显式声明：

1. `<style>` 中的 `box-sizing`
2. 静态内联 `style="box-sizing: border-box"`
3. 动态 `wx:style` / `:style` 中的 `boxSizing`
4. externalClasses 传入的样式对象

### 4. 更新 RN 样式文档

文件：`.agents/skills/mpx-rn-dev-guide/references/rn-style-reference.md`

当前文档中 `box-sizing` 默认值记录为 RN 原始默认 `border-box`。完成实现后应改为 Mpx RN 有效默认：

```md
| `box-sizing` | `border-box` \| `content-box` | `content-box` | 盒模型，Mpx RN 默认对齐小程序 / Web |
```

如果希望保留 RN 原始事实，可在说明中补充“RN 原生默认值为 `border-box`，Mpx runtime 会对业务节点补齐 `content-box`”。

### 5. 同步 dist 产物

源码改动后需要同步 `packages/webpack-plugin/lib/runtime/components/react/dist/**`。优先使用仓库已有构建脚本生成 dist，避免手写产物漂移；若本仓库当前流程要求手动同步，则仅同步以下相关文件：

1. `packages/webpack-plugin/lib/runtime/components/react/dist/utils.jsx`
2. `packages/webpack-plugin/lib/runtime/components/react/dist/mpx-simple-view.jsx`
3. `packages/webpack-plugin/lib/runtime/components/react/dist/mpx-simple-text.jsx`
4. `packages/webpack-plugin/lib/runtime/components/react/dist/mpx-inline-text.jsx`

## 兼容性与边界

1. 显式 `box-sizing` 优先级保持不变，业务可继续用 `border-box` 获取 RN 原始盒模型。
2. 不修改 RN 全局默认值，不影响第三方 RN 组件和 Mpx 内部未暴露给业务的绘制节点。
3. 对无尺寸、无 padding、无 border 的节点没有可见影响，但会让默认样式对象多一个 `boxSizing` 字段。
4. `mpx-image` 的默认 `width: 320`、`height: 240` 会按小程序语义作为 content 尺寸；用户额外设置 padding / border 时，外部占位会随之增加。
5. `splitStyle` 会把 `boxSizing` 归入 `innerStyle`，不会进入 textStyle 透传链路。
6. 运行时代码合并对象继续使用 `extendObject` / `Object.assign`，不使用 object spread。

## 验证用例

建议仅覆盖 RN 样式相关核心路径：

1. class 默认值：`.box { width: 100px; padding: 10px; border-width: 1px; }` 最终 root style 含 `boxSizing: 'content-box'`。
2. 显式覆盖：`.box { box-sizing: border-box; }` 最终仍为 `boxSizing: 'border-box'`。
3. 静态内联：`style="width: 100px; padding: 10px"` 最终补 `content-box`。
4. 动态样式：`wx:style="{{ { width: 100, padding: 10 } }}"` 最终补 `content-box`。
5. 样式优先级：class 默认补值不覆盖动态 style 中显式传入的 `boxSizing: 'border-box'`。
6. `mpx-image`：默认宽高叠加 padding / border 后外部布局尺寸符合 content-box 预期。
7. `mpx-simple-view` / `mpx-simple-text` / `mpx-inline-text`：直接透传样式时也有默认 `content-box`。

执行变更后只需跑 RN runtime 样式相关单测、最小 RN demo 编译或已有组件编译校验，无需全量测试。
