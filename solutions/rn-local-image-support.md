# RN 本地图像渲染支持方案

## 背景与问题

Mpx 输出 RN 时，`image` 基础组件已映射到 `mpx-image`，运行时底层使用 React Native 的 `Image` 或 `@d11/react-native-fast-image` 渲染。当前远程图片、base64 图片以及 `file://` / 临时文件路径这类字符串 URI 基本可以按 RN 的 `{ uri }` 方式工作。

但对“项目内本地静态图片”，也就是业务在模板中写：

```xml
<image src="./logo.png" />
```

当前 RN 输出链路尚未完整支持。实际模板生成结果仍是普通字符串：

```js
createElement(getComponent("mpx-image"), { src: "./logo.png" })
```

该字符串不会进入 webpack 资源模块，也不会被 RN 识别为本地 bundle asset。与此同时，`mpx-image` 运行时固定生成：

```ts
source: { uri: src }
```

而 RN 本地静态图片需要 `source={require('./logo.png')}` 这类模块值，通常是 number 或 asset object。因此当前能力只能覆盖 URI 字符串场景，不能覆盖打包内静态资源场景。

## 现状分析

### 1. 静态资源 loader 具备 RN 输出能力

`packages/webpack-plugin/lib/file-loader.js` 在 RN 模式下会把资源模块导出成：

```js
module.exports = __mpx_require_external__("img/logo.xxx.png")
```

随后 `packages/webpack-plugin/lib/index.js` 中的 parser hook 会把 `__mpx_require_external__` 替换为相对 chunk 的：

```js
require("./img/logo.xxx.png")
```

也就是说，只要图片引用能够以 JS `require(...)` 的形式进入 webpack 模块图，静态资源打包链路本身是有 RN 分支的。

### 2. RN 模板编译没有把 image src 转为资源 require

RN 模板走 `packages/webpack-plugin/lib/react/processTemplate.js`，直接调用 `template-compiler/compiler.js` 解析模板，再由 `gen-node-react.js` 生成 React render 代码。

`gen-node-react.js` 当前对静态属性只做 JSON 字符串输出：

```js
const attrExp = attrExpMap[name] ? attrExpMap[name] : s(value)
attrs.push(`${mapAttrName(name)}: ${attrExp}`)
```

因此 `<image src="./logo.png">` 不会像小程序静态 wxml loader 那样扫描 `image:src` 并转换为 `require(...)`。

### 3. RN 运行时 mpx-image 只按 uri 字符串处理

`packages/webpack-plugin/lib/runtime/components/react/mpx-image.tsx` 当前关键逻辑：

```ts
const isSvg = isSvgProp || SVG_REGEXP.test(src)
RNImage.getSize(src, ...)
source: { uri: src }
```

这说明：

1. `src` 类型事实上只按 string 设计。
2. `RNImage.getSize` 只处理 URI 字符串。
3. 即使业务在 script 中 `import logo from './logo.png'` 后通过 `<image src="{{ logo }}" />` 传入，运行时也会变成 `{ uri: logo }`，本地 asset module 仍无法正确渲染。

### 4. 受影响范围

核心受影响入口：

1. `<image src="./logo.png" />`
2. `<cover-image src="./logo.png" />`，因为 RN 下同样会转为 `mpx-image`
3. `<image src="{{ logo }}" />`，其中 `logo` 是 `require('./logo.png')` / `import logo from './logo.png'` 的结果

相关联能力：

1. `enable-fast-image` 下的本地图片
2. `widthFix` / `heightFix` / 裁剪类 mode 对本地图片尺寸的读取

已确认不纳入本方案的入口：

1. `background-image: url('./logo.png')` 当前会通过 `wxss-loader -> url-loader` 转换为内联 base64，RN 侧已经可以渲染，本方案无需额外处理。

## 目标

支持以下写法在 RN 输出中正确渲染：

```xml
<image src="./logo.png" mode="aspectFit" />
<cover-image src="../assets/avatar.png" />
<image src="{{ logo }}" />
```

```js
import logo from './logo.png'

Component({
  data: {
    logo
  }
})
```

保持已有 URI 字符串能力不退化：

```xml
<image src="https://example.com/logo.png" />
<image src="data:image/png;base64,..." />
<image src="{{ tempFilePath }}" />
```

## 推荐方案

采用“编译期处理静态本地路径，运行时兼容 asset source”的双层方案。本期只处理模板图片入口，即 `image` / `cover-image` 的 `src`，不处理样式中的 `background-image`。

### 0. 与 wxml-loader 的关系

不建议复用 `packages/webpack-plugin/lib/wxml/loader.js`，也不建议为了 RN 本地图像支持从 `wxml-loader` 中抽 shared helper 形成新耦合。

原因是两条链路的输出目标不同：

1. `wxml-loader` 面向小程序静态模板，输入 WXML 字符串，输出仍是模板字符串，只是在字符串中把资源属性替换成 `" + require(...) + "`。
2. RN 模板链路面向 React render 函数，输入模板 AST，输出 JS 表达式，例如 `createElement(getComponent("mpx-image"), { src: ... })`。
3. RN 已经在 `template-compiler/compiler.js` 中收集 `<template name>`、`<import>`、`<wxs>`、内建组件、refs、slot 等 `meta` 信息；如果先把模板交给 `wxml-loader` 字符串替换，会和这些 AST 级能力互相绕开，反而更难维护。

因此本方案采用独立的 RN 模板处理逻辑，只参考 `wxml-loader` 的判断口径，不产生代码依赖关系。RN 侧只需要识别 `image` / `cover-image` 的静态本地 `src`，并在 AST 表达式中注入普通 webpack `require(...)`。

具体边界：

1. `<import src="./item.wxml" />`：RN 当前由 `processTemplateImport` 写入 `meta.imports`，再由 `react/processTemplate.js` 和 `react/template-loader.js` 递归接入 `react/template-loader`。这条链路必须保留，否则 imported template 的内建组件、wxs、slot memo 配置都会丢失。
2. `<include src="...">`：RN 当前方案并未承诺支持，不能因为复用 `wxml-loader` 而顺手放开。
3. `<wxs module="m" src="./m.wxs" />`：RN 当前由 `postProcessWxs` 收集 `meta.wxsModuleMap`，再在 `processTemplate.js` / `template-loader.js` 生成模块级 `require`，并把内联 wxs 写入 `wxsContentMap`。不应改成 `wxml-loader` 的字符串拼接逻辑。
4. `<image src="./logo.png" />` / `<cover-image src="./logo.png" />`：在 RN AST 处理阶段独立注入 `src: require(...)` 表达式，不走 `wxml-loader`。

需要特别保证的是，本地静态图片必须进入现有 webpack 图片资源规则，继续走 `url-loader -> file-loader` 链路。也就是说，RN 模板编译只负责生成普通资源 `require`，不手动调用 `url-loader`、不手动拼 `__mpx_require_external__`，也不绕过项目已有图片 rule。

### 1. 编译期将静态本地 src 转为 require

在 RN 模板编译阶段识别静态本地图像路径：

```xml
<image src="./logo.png" />
```

生成：

```js
createElement(getComponent("mpx-image"), {
  src: require("./logo.png")
})
```

处理位置建议放在 `template-compiler/compiler.js`，由 `processTemplate.js` / `template-loader.js` 通过 parse option 注入一个 RN 专用 asset resolver。

推荐设计：

1. 新增 `processLocalAssetSrc(el, options)`，仅在 `isReact(mode)` 下执行。
2. 命中范围为原始标签 `image` / `cover-image`，或转换后的 `mpx-image`。
3. 仅处理静态 `src`，跳过以下场景：
   - 空值
   - Mustache 动态绑定，如 `{{ logo }}`
   - 远程 URL，如 `https://`
   - data URL
   - `file://`、`content://` 等运行时 URI
   - externals 命中的路径
4. 参考现有 `is-url-request.js` 口径判断本地可解析路径，但不与 `wxml-loader` 产生代码耦合。
5. 将该属性添加到 `el.exps`，让 `gen-node-react.js` 继续通过 `attrExpMap` 输出表达式。

`processTemplate.js` 中传入：

```js
resolveTemplateAsset (src) {
  const request = loaderUtils.urlToRequest(src, projectRoot)
  return `require(${loaderUtils.stringifyRequest(loaderContext, request)})`
}
```

`react/template-loader.js` 也传入同样能力，保证 imported `.wxml` 模板中的 `<image src="./logo.png" />` 与主模板一致。

这样生成的是普通 webpack 资源引用，会命中项目里已有的图片 rule：

```js
{
  test: /\.(png|jpe?g|gif|svg)$/,
  loader: MpxWebpackPlugin.urlLoader(...)
}
```

后续处理继续由 `url-loader -> file-loader` 决定：

1. 满足 base64 条件时，`url-loader` 直接导出 data URI。
2. 需要输出文件时，`url-loader` fallback 到 `file-loader`。
3. RN 模式下 `file-loader` 导出的 `__mpx_require_external__(...)` 继续由现有 dependency 替换为最终 `require("./img/...")`。

这条链路必须保留，避免 RN 模板编译绕过图片 loader 后丢失 hash、输出路径、subpackage / external request 记录等已有能力。

### 2. 运行时 mpx-image 支持 string 与 asset module

调整 `mpx-image.tsx` 的 `src` 类型与 source 归一逻辑。

建议新增工具函数：

```ts
type MpxImageSource = string | number | RNImageSourcePropType

function isUriSource (src: MpxImageSource): src is string {
  return typeof src === 'string'
}

function normalizeImageSource (src: MpxImageSource) {
  if (typeof src === 'string') {
    return { uri: src }
  }
  return src
}
```

`renderBaseImage` 改为：

```ts
source: normalizeImageSource(src)
```

相关逻辑也要避免把非字符串当 URI：

1. `SVG_REGEXP.test(src)` 仅在 `typeof src === 'string'` 时执行。
2. `RNImage.getSize(src, ...)` 仅用于字符串 URI。
3. 本地 asset module 使用 `RNImage.resolveAssetSource(src)` 获取 `width` / `height` / `uri`。
4. `bindload` 的 `detail.width` / `detail.height` 优先取 `evt.nativeEvent.source`，其次取 `resolveAssetSource`，最后才对字符串 URI 调 `getSize`。

`widthFix`、`heightFix`、裁剪类 mode 依赖图片原始尺寸，需统一封装尺寸读取：

```ts
function getImageSize (src, success, fail) {
  if (typeof src === 'string') {
    RNImage.getSize(src, success, fail)
    return
  }
  const source = RNImage.resolveAssetSource(src)
  if (source && source.width && source.height) {
    success(source.width, source.height)
  } else {
    fail && fail()
  }
}
```

### 3. fast-image 降级策略

当前 `renderImage` 在 `enable-fast-image` 为真时会优先使用 `@d11/react-native-fast-image`。本地 asset module 是否被该实现完整支持需要实测确认。

建议保守处理：

1. `src` 为字符串 URI 时，保持 `enable-fast-image` 逻辑不变。
2. `src` 为本地 asset module 时，默认使用 RN 原生 `Image`。
3. 如果验证 `@d11/react-native-fast-image` 支持 number/object source，再放开该限制。

这样不会影响已有远程图片优化链路，也能避免本地 asset 在 fast-image 下出现无法加载的风险。

### 4. SVG 边界

当前 SVG 分支依赖 `SvgCssUri`：

```ts
<SvgCssUri uri={src} />
```

因此本期建议只保证以下 SVG 场景：

1. 远程 SVG URL
2. base64 / data URL

本地 `.svg` 被编译为 RN asset module 后，不再适合走 `SvgCssUri`。可先按普通 RN Image 处理，或在后续独立支持 `SvgXml` / transformer 类方案。方案文档和测试中需要明确该边界。

### 5. background-image 不纳入本方案

`background-image: url('./logo.png')` 当前已经会通过 `wxss-loader -> url-loader` 转换为内联 base64，运行时仍按字符串 URI 进入 `mpx-view` 的背景图渲染逻辑即可。

因此本方案不再为背景图增加额外的 asset source 处理，也不修改 `style-helper.js` / `mpx-view.tsx` 的背景图链路。后续只有在明确需要保留背景图本地资源为 RN asset module，而不是 base64 时，才需要重新评估样式链路。

## 修改清单

本期建议涉及文件：

1. `packages/webpack-plugin/lib/template-compiler/compiler.js`
   - 增加 RN 静态 image src 识别与表达式注入。
   - 沿用 `is-url-request.js` 的本地资源判断口径，避免远程 URL / 动态表达式误处理。

2. `packages/webpack-plugin/lib/react/processTemplate.js`
   - 向 `templateCompiler.parse` 传入 `resolveTemplateAsset`。
   - 确保主模板生成的 `require(...)` 以当前 `.mpx` 文件为上下文解析。

3. `packages/webpack-plugin/lib/react/template-loader.js`
   - 向 imported `.wxml` 模板传入同样的 asset resolver。
   - 保证外部模板内的本地图片路径按 `.wxml` 文件上下文解析。

4. `packages/webpack-plugin/lib/template-compiler/gen-node-react.js`
   - 理想情况下无需改动，继续消费 `el.exps` 中的 `src` 表达式即可。
   - 若实现中选择增加特殊标记，也应保持改动最小。

5. `packages/webpack-plugin/lib/runtime/components/react/mpx-image.tsx`
   - `src` 类型扩展为 string 或 RN image source。
   - 封装 source 与尺寸读取逻辑。
   - 非字符串 source 不走 SVG URI 判断。

6. `packages/webpack-plugin/lib/runtime/components/react/utils.tsx`
   - 可放置 `normalizeImageSource` / `getImageSize` 等公共 helper。
   - 供 `mpx-image` 处理 string URI 与本地 asset source。

7. `packages/webpack-plugin/lib/runtime/components/react/dist/**`
   - 源码改动后同步 dist 产物，优先使用仓库既有构建流程生成。

8. 文档与 skill
   - 该变更涉及 RN 基础组件对外能力，需要同步更新 `docs-vitepress/guide/rn/component.md`。
   - 也需要同步更新 `.agents/skills/mpx2rn/references/rn-template-reference.md` 中 `image` / `cover-image` 的能力说明。

## 测试建议

只覆盖相关核心路径，无需全量测试。

### 编译侧

新增或补充 RN template 单测：

1. `<image src="./logo.png" />` 生成 `src: require("./logo.png")`。
2. `<cover-image src="./avatar.png" />` 生成 `src: require("./avatar.png")`。
3. `<image src="https://example.com/logo.png" />` 仍生成字符串。
4. `<image src="data:image/png;base64,..." />` 仍生成字符串。
5. `<image src="{{ logo }}" />` 仍生成动态表达式，不在编译期改写。
6. imported `.wxml` 中的 `<image src="./logo.png" />` 也生成 require。

### 运行时

新增或补充 `mpx-image` 组件单测：

1. 字符串 URL 仍传给 RN Image `{ uri: url }`。
2. 本地 asset module 直接传给 RN Image `source`。
3. 本地 asset 下 `widthFix` / `heightFix` 能通过 `resolveAssetSource` 取得尺寸。
4. 本地 asset 下 `bindload` detail 包含 width / height。
5. `enable-fast-image` + 本地 asset 按预期降级或通过验证后直接支持。

### 集成验证

准备一个最小 RN demo：

```xml
<template>
  <view>
    <image class="logo" src="./assets/logo.png" mode="aspectFit" />
    <image class="logo" src="{{ logo }}" mode="widthFix" />
  </view>
</template>

<script>
import logo from './assets/logo.png'

Component({
  data: {
    logo
  }
})
</script>

<style>
.logo {
  width: 120px;
  height: 120px;
}
</style>
```

验证 iOS、Android 至少各一端可正常显示，并确认远程图片和 base64 图片没有回归。

## 风险与边界

1. 本地 asset source 不是字符串，所有 `src` 字符串 API 都要先做类型判断。
2. `RNImage.getSize` 不适合直接处理 asset module，需要改用 `resolveAssetSource`。
3. fast-image 的本地 asset 支持需实测，不建议默认假设兼容。
4. 本地 SVG 与普通位图不完全等价，本期不承诺 `SvgCssUri` 方式支持本地 SVG。
5. `background-image` 已经通过 `wxss-loader -> url-loader` 转换为 base64 支持，不属于本方案处理范围。
6. 编译期注入 `require(...)` 后，仍要遵守仓库运行时代码不使用 object spread 的约束，相关对象合并继续使用 `Object.assign` / `extendObject`。

## 结论

当前 RN 输出不完整支持打包内本地静态图片。资源 loader 已有 RN require 输出能力，但 RN 模板没有把静态 `image src` 接入资源模块，`mpx-image` 运行时也只按 URI 字符串处理。

建议按“编译期静态路径 require 化 + 运行时 source 归一化”实现。这样既能覆盖 `<image src="./logo.png">` 的小程序常用写法，也能兼容脚本中 `import logo from './logo.png'` 后动态绑定的用法，并且对远程 URI / base64 / 临时文件路径保持向后兼容。
