# 支付宝 text 换行继承与 scroll-view 滚动条显隐适配方案

## 背景与目标

本方案承接 [微信与支付宝小程序跨端开发最佳实践](../.agents/skills/mpx/mini-program-practice.md)，将两项重复的业务处理收敛到 `@mpxjs/webpack-plugin`：

1. 支付宝 `text` 默认继承父级 `white-space`，同时保证用户自定义样式可以覆盖框架默认值。
2. 微信语法的 `scroll-view show-scrollbar` 在支付宝目标下，通过原节点的条件类名控制滚动条隐藏。

同时迁移当前 `style-compiler` 在 App 样式末尾注入的 `.${MPX_ROOT_VIEW} { display: initial }` 与 `page { line-height: normal }`。支付宝规则并入共享兼容 ACSS，Web 规则直接合入现有 `runtime/base.styl`，保留两个目标的覆盖并先于用户 App 样式加载；删除旧注入路径，避免多次注入或新旧规则分别位于首尾。

**状态：代码、自动化测试、用户文档与本地 Skill 同步已完成；支付宝滚动条节点级选择器仍待真机验收。** 用户已验证 `text { white-space: inherit }` 有效，并确认支付宝会将 `text` 选择器转换为 `.a-text` 类选择器。因此不能依赖标签选择器低优先级来避免覆盖用户样式，必须保证兼容规则在全局用户样式之前加载。

滚动条方案尚需验证精确作用于单个 `scroll-view` 的选择器，不能以已有全局 `::-webkit-scrollbar` 的效果代替节点级适配验收。

## 范围与对外行为

| 能力 | 生效范围 | 对外行为 |
| --- | --- | --- |
| 文本默认样式 | `mode: 'ali'` 的完整应用构建 | 全局提供 `text { white-space: inherit }`，允许业务样式覆盖 |
| 滚动条属性转换 | 模板有效源码方言为 `wx`，目标为 `ali` | 显式布尔 `false` 隐藏；`true` 取消框架隐藏样式，恢复宿主默认行为 |
| 现有根节点与 page 默认样式 | 支付宝与 Web 的 App | 保留原选择器与声明，迁移为用户 App 样式之前加载的默认值 |
| 其他目标 | 微信、其他小程序、RN | 保持当前编译行为 |
| 支付宝原生模板 | 有效源码方言为 `ali` | 不转换 `show-scrollbar`；仍会受到所在应用的全局文本默认样式影响 |

不新增用户配置开关，不引入运行时组件或设备判断，不自动开启微信 `enhanced`，不扩展实现 `refresher-*`、`paging-enabled` 等滚动能力。文本修复只解决换行继承，不自动补充宽度、`overflow` 或完整的省略号布局。

第一版以拥有 App 全局样式入口的应用为交付范围，包括普通分包。独立分包、插件产物、仅编译页面或组件等不具备相同全局样式继承条件的场景，不承诺自动覆盖；不能仅凭这些产物出现隐藏类就宣称适配已生效。后续如需支持，应以各自可用的样式入口单独接入，而不是给全部组件重复注入文本默认规则。

## 当前架构与接入位置

| 位置 | 当前行为 | 本方案利用方式 |
| --- | --- | --- |
| [loader.js](../packages/webpack-plugin/lib/loader.js) | 按顺序请求多个 style 块；支付宝 App 没有内联 style 时还会生成空样式请求 | 保留用户 style 提取；新资产流程接管默认规则后，移除仅为触发旧注入而生成的空请求 |
| [style-compiler/index.js](../packages/webpack-plugin/lib/style-compiler/index.js) | 在支付宝与 Web 的 App 样式编译结果末尾添加根节点与 `page` 默认规则 | 删除该注入分支及因此不再使用的变量、导入 |
| [runtime/base.styl](../packages/webpack-plugin/lib/runtime/base.styl) / [web/processMainScript.js](../packages/webpack-plugin/lib/web/processMainScript.js) | Web 主入口先导入基础样式，再加载 App | 将 Web 的两条旧默认规则合入基础样式，复用现有导入 |
| [extractor.js](../packages/webpack-plugin/lib/extractor.js) | `style src` 产生 `pre: true` 的 `@import` 提取信息 | 兼容样式入口必须排在这些 import 之前 |
| [webpack-plugin/lib/index.js](../packages/webpack-plugin/lib/index.js) | `beforeModuleAssets` 先拼接 pre 内容，再拼接普通样式 | 等待提取完成后统一处理全局入口 |
| [unocss-plugin/lib/index.js](../packages/unocss-plugin/lib/index.js) | 向全局样式头部插入 UnoCSS import | 调整为 `PROCESS_ASSETS_STAGE_ADDITIONS - 1`，先于主插件完成生成与注入 |
| [scroll-view.js](../packages/webpack-plugin/lib/platform/template/wx/component-config/scroll-view.js) | 支付宝 `show-scrollbar` 与其他暂不支持的属性共用诊断规则 | 拆出该属性的支付宝专用转换 |
| [normalize-component-rules.js](../packages/webpack-plugin/lib/platform/template/normalize-component-rules.js) | 逐项转换属性并接受属性转换器返回的新 attrs 数组 | `show-scrollbar` 在 props 转换阶段消费源属性并合并 class，不占用仅用于标签名转换的主转换器 |
| [template-compiler/compiler.js](../packages/webpack-plugin/lib/template-compiler/compiler.js) | 平台规则之后继续执行 scoped、externalClasses、class、属性与渲染依赖处理 | 让生成的条件类名继续走现有流程 |

## 全局兼容样式的产出与顺序

### 默认规则按目标归档

支付宝在 `utils/ali-compat-style.js` 中维护兼容资产内容，复用 `MPX_ROOT_VIEW` 常量生成根节点选择器；Web 直接在现有 `runtime/base.styl` 中维护基础样式，不新增跨平台 CSS 生成函数：

| 规则 | ali | web |
| --- | --- | --- |
| `.${MPX_ROOT_VIEW} { display: initial }` | 输出 | 输出 |
| `page { line-height: normal }` | 输出 | 输出 |
| `text { white-space: inherit }` | 输出 | 不输出 |
| `.mpx-scrollbar-hidden::-webkit-scrollbar` | 输出 | 不输出 |

按现有目标流水线接入：支付宝使用 ACSS 资产，Web 使用既有基础样式模块。两个目标各自保留这两条简单默认规则，不为消除少量声明重复增加跨平台生成或导入机制。不要在 Web 中生成小程序 ACSS、额外 App style 块或新的默认样式入口。

旧规则从“用户样式之后”改为“用户样式之前”是此次迁移的明确行为调整：同优先级的用户声明现在可以覆盖框架默认值。无用户覆盖时维持原默认表现；不应把这一调整描述成完全不改变级联顺序的内部重构。

### 使用首个 import，避免破坏用户 import

生成一份框架专用 ACSS 资产，并将其引用插入全局样式的第一个 import 位置。最终结构如下，文件名仅为示例：

```css
/* app.acss */
@import "./mpx-ali-compat.acss";
@import "./styles/uno.acss";
@import "./styles/common.acss";

/* 用户原有的全局样式 */
.title {
  white-space: normal;
}
```

```css
/* mpx-ali-compat.acss */
.mpx-root-view {
  display: initial;
}

page {
  line-height: normal;
}

text {
  white-space: inherit;
}

.mpx-scrollbar-hidden::-webkit-scrollbar {
  width: 0;
  height: 0;
  color: transparent;
  display: none;
}
```

使用首个 import 而不是直接把普通 CSS 规则拼到现有 import 前，避免后续 import 在标准 CSS 解析或优化中失效。若入口包含必须位于文件开头的 `@charset`，保留其位置，兼容 import 紧随其后；“最前”指所有实际样式规则之前。

文本选择器在交给支付宝编译前仍写为 `text`，不直接依赖宿主内部 `.a-text` 名称。不得加入 `!important`、scoped 后缀或其他提高优先级的限定。用户验证的 `.a-text` 转换意味着它可能与业务 `.title` 同优先级，通过加载顺序保证后者覆盖默认值。

### 产物阶段

保留 `webpack-plugin/lib/index.js` 现有 `processAssets` 处理器的有效执行阶段。将 UnoCSS 小程序处理器提前到 `compiler.webpack.Compilation.PROCESS_ASSETS_STAGE_ADDITIONS - 1`（本地 Webpack 中为 `-101`），并注明先于 Mpx 主插件执行。后续在主插件现有资产包装回调中接入支付宝兼容样式注入，无需新增另一套执行阶段：

**阶段常量核对：** 本地 Webpack 的阶段常量是 `Compilation` 类的静态属性，不是 `compilation` 实例属性。主插件现有 `compilation.PROCESS_ASSETS_STAGE_ADDITIONS` 实际为 `undefined`，因此按默认阶段 `0` 执行；原 UnoCSS 写法也相同。直接对实例属性加减会得到 `NaN`，不能实现预期顺序。本次仅修正 UnoCSS 取值，不顺便将主插件从实际的 `0` 改到 `-100`，避免扩大影响面。若以后清理主插件的错误常量引用，应明确保留 `0` 或另行评估改为真正 additions 阶段的行为变化。

1. 先检查 `mode === 'ali'` 且存在有效的 `mpx.appInfo.name`，再计算资产名和内容。
2. 使用 `appInfo.name` 与当前平台的样式扩展名得到全局入口，不写死 `app.acss`。
3. 将兼容资产放在全局入口同级，使用现有 `to-posix`、`fix-relative` 等方法生成相对路径。
4. 通过 `emitAsset` 产出兼容样式；通过 `updateAsset` 和 `ConcatSource` 前置 import，保留原 Source。入口尚不存在时创建仅含该 import 的入口。
5. 兼容资产路径作为框架保留路径；若与已有用户资产冲突，应报出明确构建错误，不能静默覆盖。

Webpack 的 `processAssets` 使用串行异步钩子，因此主插件会等待 UnoCSS 的 `tapPromise` 完成，包含其中的样式生成和分包处理。本次仅调整 UnoCSS 的 `processAssets` 阶段；其 `thisCompilation` 的 `stage: 1000` 继续保留，用于在 Mpx 初始化 `compilation.__mpx__` 后注册处理逻辑。

兼容样式注入放在主插件原有 Web 提前返回之后，并限制为 ali；构建映射和 JS chunk 包装继续按原顺序执行。主插件另一处未指定 stage 的动态资产回调也处于默认阶段 `0`，仍按注册顺序先于资产包装回调执行，不一并移动。

每次 compilation 都从本次资产重新生成入口，不能用跨构建全局变量记录“已注入”。这一设计不依赖 loader 是否命中持久化缓存，也不需要额外的模板使用量统计依赖。

当前仓库控制范围内保证兼容 import 位于业务与 UnoCSS 样式前。第三方插件若在更晚阶段再次前置 CSS，需要遵守“框架兼容 import 保持首位”的顺序约定；不能声称能够自动约束任意后处理插件。开启样式优化时也须验收最终 import 展开后的级联顺序。

### UnoCSS 提前执行的影响评估

采用 UnoCSS 前移而非主插件后移，影响集中在小程序样式处理，不改变主插件所有非 Web 目标的 JS 包装时序。

| 环节 | 影响与依据 |
| --- | --- |
| Mpx 模板、样式提取 | 在 `beforeModuleAssets` 已完成，早于整个 `processAssets`；UnoCSS 提前后仍可读取产物及 `assetsModulesMap` |
| UnoCSS 主包、普通分包与独立分包样式 | 同一异步回调整体从有效阶段 `0` 移到 `-101`，内部扫描、转义、CSS 生成与 import 注入次序不变 |
| 主插件构建映射、runtime 引用和 JS 包装 | 保持有效阶段 `0`，UnoCSS 当前仅扫描目标模板与样式后缀，不依赖这些 JS 改写或构建映射 |
| 主插件动态资产处理 | 默认阶段 `0` 不变，由原先在 UnoCSS 之前变为之后；该回调写入组件 JSON 与 dynamic.json，不是 UnoCSS 扫描的模板或样式资产 |
| Web 与 RN | 此次调整的 UnoCSS 小程序回调在这两个目标下不注册；其专用插件以及主插件原有阶段保持不变 |
| BannerPlugin | 默认阶段为 `-100`，原本就先于有效阶段 `0` 的主插件；两者相对顺序保持不变。UnoCSS 现在先于 banner，扫描结果不再包含 banner 在模板或样式中新增的内容 |
| 优化、压缩、source map | `-101` 仍早于常规优化与 source map 阶段；不修改资产内容算法或 Source 类型 |
| 自定义第三方插件 | 若在 `-100` 到 `0` 期间才新增或修改模板、样式，新的 UnoCSS 扫描将看不到这些变化；需要扫描的内容应在 `-101` 之前准备好，不能依赖原先同阶段的注册先后顺序 |

此前按代码字面将主插件视为 `-100`，并据此判断后移会改变 BannerPlugin 相对顺序，这一判断已被本地实际常量取值修正。使用正确静态常量把主插件改到 `ADDITIONS + 1`，实际是从 `0` 前移到 `-99`，仍在默认 banner 之后，但会跨过其他插件的执行阶段，并先于主插件自己的默认阶段动态资产回调。因此本方案选择只移动 UnoCSS；不借此修复原本已经存在的“JS 包装代码可能位于 banner 前”的行为。

跨包发布需配套说明：后续主插件兼容样式注入若依赖这一先后约定，必须搭配已调整阶段的 `@mpxjs/unocss-plugin`。旧版 UnoCSS 实际仍在 `0`，不能假设它已经先于主插件完成；测试与发布说明应明确这一版本组合条件。未安装 UnoCSS 的应用不受该阶段变更影响。

### Web 接入与旧路径清理

Web 不进入上述支付宝资产处理器，直接修改 `runtime/base.styl`：

- 增加 `.mpx-root-view { display: initial }`。类名与 `MPX_ROOT_VIEW` 保持一致，由测试核对，不为 Stylus 引入 JavaScript 常量读取机制。
- 将 `line-height: normal` 合入文件中已有的 `page` 规则，保留其 display、尺寸和背景声明，不再新增第二个 page 规则块。
- 复用 `web/processMainScript.js` 开头已有的 `import '@mpxjs/webpack-plugin/lib/runtime/base.styl'`，不增加重复导入，也不修改 `web/processStyles.js`。
- 基础样式沿用现有全局加载方式，不受业务 `autoScope` 控制。App 无 style、仅使用 `style src` 或包含多个 style 块时都不需要额外兜底；普通页面与组件不重复注入。
- 开发态样式注入与生产态 CSS 提取沿用当前流程，分别验证基础样式早于用户 App 样式。无 Web 主入口且未加载 `base.styl` 的独立组件产物，不额外扩大注入范围。
- Web 只迁移原有两条规则，不加入支付宝的 text 或滚动条规则，不改变 `base.styl` 内其余基础样式及现有 UnoCSS 流程。

删除 `style-compiler/index.js` 中整个 `(mode === 'ali' || mode === 'web') && isApp` 注入分支，并移除仅供它使用的 `MPX_ROOT_VIEW` 导入、`appInfo` 与 `isApp` 局部变量。保留样式编译器其余 PostCSS、scoped、条件编译和运行时样式处理。

支付宝 App 的默认样式已由产物阶段保证存在，因此删除 `loader.js` 中“无内联 style 时额外请求一个空 styles 模块”的旧补偿分支；保留真实空 `<style>` 和全部用户样式请求。实施时用无 style、仅外部 style 的完整构建验证这一删除不会影响其他产物。Web App 则由已有 `base.styl` 加载流程覆盖，无需保留旧样式编译器注入作为第二条路径。

### 样式体积与按需生效

第一版在支付宝共享资产内固定输出公共两条与支付宝新增两条规则；Web 仅输出公共两条。只有声明隐藏意图的滚动节点才获得 `mpx-scrollbar-hidden`，因此滚动条行为按节点生效。

不为省略这几行 CSS 新增跨模块使用量收集、持久化依赖和 watch 清理机制，也不通过扫描最终 AXML 字符串判断需求。没有使用 `show-scrollbar` 的应用只增加一条未命中的规则，不增加运行时代码。

## scroll-view 属性转换

### 输入约定

业务保持微信布尔属性写法：

```html
<scroll-view
  class="list {{sizeClass}}"
  scroll-y="{{true}}"
  show-scrollbar="{{showScrollbar}}"
>
  <view>列表内容</view>
</scroll-view>
```

| 输入 | 支付宝编译结果 |
| --- | --- |
| 未声明 `show-scrollbar` | 不生成隐藏类或额外表达式 |
| `show-scrollbar` / `show-scrollbar=""` | 按布尔属性存在处理，不生成隐藏类 |
| `show-scrollbar="{{true}}"` | 不生成隐藏类 |
| `show-scrollbar="{{false}}"` | 生成静态隐藏类 |
| `show-scrollbar="{{expression}}"` | 表达式结果为布尔 `false` 时生成隐藏类，否则移除 |
| `show-scrollbar="false"` | 字符串不是布尔 false，不作为隐藏指令；文档引导使用插值布尔值 |

动态值按布尔契约使用，采用严格判断 `=== false`；`undefined`、`null`、`0` 不解释为隐藏，避免尚未赋值时意外关闭宿主默认显示。这里明确的是本次支持范围，不宣称对非布尔输入复刻微信全部隐式转换行为。表达式应保持纯计算，沿用现有模板约束。

`true` 仅移除框架隐藏类，不输出强制显示样式，也不覆盖业务自己声明的滚动条样式。支付宝本身默认不显示滚动条的设备不会因为传入 true 被强制显示。

### 转换流程

1. 在 `scroll-view.js` 中为 `show-scrollbar` 增加独立规则，保留其他目标原有的诊断与处理。不要从共享正则中直接删去后遗漏其他平台诊断。
2. 支付宝 `show-scrollbar` props 转换器消费源属性，并返回新的 attrs 数组；不使用组件的 `ali` 主转换器，因为该转换器只负责标签名转换。
3. 复用 `parseMustacheWithContext` 解析表达式；仅对已有常量解析机制可确认的布尔值做静态折叠，不引入新的表达式求值器。
4. 转换器通过 `attrsMap` 读取原 `class`，返回包含合并后 class attr 的新数组；同层 class 规则在声明 `show-scrollbar` 时消费原 class，最终 `attrsList` 与 `attrsMap` 统一由外层标准流程重建，因此不依赖属性书写顺序。没有 class 且不需要隐藏时返回空数组。
5. 保留原 `wx:class` 转换结果，让后续 `processClass` 将其与更新后的 class 合并。生成表达式必须在现有 `processAttrs` / 渲染依赖收集之前进入 AST。

动态输入的语义产物如下，实际括号、引号与空白沿用现有序列化器：

```html
<scroll-view
  class="list {{sizeClass}} {{showScrollbar === false ? 'mpx-scrollbar-hidden' : ''}}"
  scroll-y="{{true}}"
>
  <view>列表内容</view>
</scroll-view>
```

不改变标签名，不插入 `view`，不增加 `usingComponents`，不通过组件 props 透传重建原生滚动容器。事件、ref、节点查询和 `scroll-top` 等属性继续走原流程。

条件属性与显式目标平台写法沿用现有 `processAtMode` 规则，不增加另一套优先级逻辑。测试必须覆盖这些写法，保证被条件编译删除的属性不会触发补丁；显式跳过方言转换的属性仍保留其现有含义。

### 节点级选择器的验收条件

优先采用 `.mpx-scrollbar-hidden::-webkit-scrollbar`，只作用于标记节点自身。原文的全局规则不足以证明这一选择器在支付宝内部滚动节点上有效，需要检查开发者工具中的实际生成结构并在真机验证。

不得为追求“隐藏有效”直接扩成 `.mpx-scrollbar-hidden ::-webkit-scrollbar` 或全局 `::-webkit-scrollbar`：前者可能连带隐藏嵌套滚动容器，后者影响未声明属性的节点。

必须验证相邻滚动容器互不影响，以及“外层隐藏、内层恢复默认”的嵌套组合。若宿主结构导致自身伪元素选择器无法命中，需要先确认一个仅命中该容器滚动区域、不会匹配嵌套业务容器的稳定方案，再决定是否实施；验证失败时保留现有不支持诊断，不能交付表面完成但无效果的转换，也不能把内部 DOM 结构猜测写成保证。

## 样式优先级与兼容边界

- 默认文本规则必须早于 `style src`、全局 `@import`、内联 style 和 UnoCSS 用户规则；只在某个 style 块开头插入无法满足此要求。
- 业务显式声明 `text`、`.title`、行内 `white-space` 时，继续按支付宝实际级联规则覆盖框架默认值；scoped 与原子类写法同样验收。
- `autoScopeRules` 不应将共享兼容资产变成 App scope 样式，否则可能无法覆盖普通组件；共享资产直接在产物阶段输出，不经过业务 scoped 改写。
- 普通页面与组件依赖全局样式的既有可见性，不给每个组件重复注入。宿主真正的样式隔离边界若阻止继承，需要单独适配，不能与编译期 scoped 混为一谈。
- 根节点与 `page { line-height: normal }` 和新增规则一同前置。支付宝与 Web 均删除旧追加注入，验证规则不丢失、不重复，以及用户同优先级覆盖有效。
- 两项修复互相独立：若滚动条节点选择器验证未通过，已验证的 text 默认样式仍可以先行实施。

## 预计改动范围

| 文件 | 实现内容 |
| --- | --- |
| [webpack-plugin/lib/index.js](../packages/webpack-plugin/lib/index.js) | 保持现有有效阶段 `0`，后续在资产包装回调内接入支付宝兼容样式资产与全局首个 import |
| [unocss-plugin/lib/index.js](../packages/unocss-plugin/lib/index.js) | 小程序 processAssets 提前到 additions - 1，注释说明先于主插件执行 |
| `packages/webpack-plugin/lib/utils/ali-compat-style.js`（新增） | 维护支付宝兼容 CSS 与资产注入的窄职责实现；不设计通用 polyfill 注册系统 |
| [style-compiler/index.js](../packages/webpack-plugin/lib/style-compiler/index.js) | 删除旧默认样式追加注入和无用变量、导入 |
| [loader.js](../packages/webpack-plugin/lib/loader.js) | 删除支付宝 App 仅为触发旧默认样式注入而生成的空样式请求 |
| [runtime/base.styl](../packages/webpack-plugin/lib/runtime/base.styl) | 增加根节点 display 默认值，在已有 page 规则中补充 line-height |
| [utils/const.js](../packages/webpack-plugin/lib/utils/const.js) | 定义隐藏类名常量，由模板与样式两侧共用，避免名称漂移 |
| [scroll-view.js](../packages/webpack-plugin/lib/platform/template/wx/component-config/scroll-view.js) | 属性拆分、解析与原 class 合并 |
| `packages/webpack-plugin/test/platform/wx/template/scroll-view.spec.js`（新增） | 基于现有 `compileTemplate` 验证核心转换；需要 scoped 等选项时直接调用 compiler |
| `packages/webpack-plugin/test/ali-compat-style.spec.js`（新增） | 验证资产顺序、空入口、路径、冲突及重复构建 |
| `packages/webpack-plugin/test/web-compat-style.spec.js`（新增） | 验证 base.styl 编译结果、根节点常量一致性、开发与生产加载顺序及旧注入移除 |

预计无需修改 core、api-proxy 和 template-compiler 公共流程；UnoCSS 仅调整小程序钩子的 stage 与注释。若实现时发现缺少已有 AST 工具，应先复用现有导出，避免为单一属性扩展通用组件架构。

实现落地时同步更新 [跨端基础文档](../docs-vitepress/guide/cross-platform/basic.md)，说明支付宝文本默认样式、`show-scrollbar` 的布尔契约与宿主显示边界，以及支付宝 / Web 公共默认样式前置后的覆盖规则，并修订 [小程序最佳实践](../.agents/skills/mpx/mini-program-practice.md) 中对应的业务绕过建议。根据 [文档约束](../docs-vitepress/AGENTS.md) 处理标题锚点和索引；扩展已有页面且不改变导航时不新增侧边栏条目。能力不涉及 RN，无需修改 RN Skill。

## 测试与验收

### 核心自动化检查

1. **文本顺序**：App 无 style、仅外部 style、多个 style、嵌套 import 时，兼容 import 均位于全局用户样式之前；源文件次序和用户样式内容保持不变。
2. **UnoCSS 顺序**：同时启用 UnoCSS，确认它前置的 import 最终位于兼容 import 后；覆盖全局及 isolated 注入模式。
3. **产物与缓存**：自定义 App 入口名、输出子目录、保留 `@charset`、空资产、资产冲突、watch 与持久化缓存重新构建，兼容内容每次仅注入一份。非 ali 产物无新增兼容资产。
4. **滚动条转换**：省略、空属性、布尔常量、动态布尔、字符串 false、未赋值，以及原 class / 插值 class / `wx:class` 组合；调换属性顺序结果一致；其他滚动属性和事件不变。
5. **方言与模板**：wx 到 ali 触发；其他目标和 ali 原生源码不触发；条件属性、外部模板、具名模板与循环项局部变量沿用现有处理。生成的动态条件进入渲染依赖，状态更新不被渲染优化遗漏。
6. **诊断回归**：支付宝 `show-scrollbar` 成功转换后不再报不支持；其他平台及 `enhanced` 等属性的现有诊断不被误删。
7. **旧规则迁移**：支付宝所有 App 样式组合下，根节点与 page 默认声明均只输出一次；删除空请求后仍能生成兼容入口。直接调用 style-compiler 时不再隐式追加默认规则。
8. **Web 回归**：编译 `base.styl`，确认根节点选择器与 `MPX_ROOT_VIEW` 一致、page 原声明保留且增加 line-height。App 无 style、仅外部 style、多 style、autoScope、UnoCSS 场景均复用一次基础样式加载，不生成额外默认 style 块，普通组件不重复注入。分别验证开发态样式加载和生产提取顺序；基础默认规则早于用户 App 样式，同优先级业务覆盖有效，不混入支付宝专用规则。
9. **阶段顺序**：验证实际注册的 UnoCSS stage 是有限数值 `-101`，异步生成全部完成后主插件才执行；保留默认 BannerPlugin 与 JS 包装的原有相对顺序，后续 source map 正常生成。使用真实钩子顺序与构建产物验证，不仅检查代码中字面出现的常量名称。

测试不只断言某个拼接函数的字符串。需至少有完整构建用例检查最终全局样式及模板产物，覆盖提取器、UnoCSS 注入和优化阶段的实际顺序。使用自定义类规则与导入文件制造覆盖关系，核对框架规则始终处于前面。

实现完成后执行相关文件 ESLint 与 Jest，建议范围为：

```sh
npx eslint packages/webpack-plugin/lib/index.js \
  packages/unocss-plugin/lib/index.js \
  packages/webpack-plugin/lib/loader.js \
  packages/webpack-plugin/lib/style-compiler/index.js \
  packages/webpack-plugin/lib/utils/const.js \
  packages/webpack-plugin/lib/utils/ali-compat-style.js \
  packages/webpack-plugin/lib/platform/template/wx/component-config/scroll-view.js \
  packages/webpack-plugin/test/platform/wx/template/scroll-view.spec.js \
  packages/webpack-plugin/test/ali-compat-style.spec.js \
  packages/webpack-plugin/test/web-compat-style.spec.js

npm test -- --runInBand --watchman=false \
  packages/webpack-plugin/test/platform/wx/template/ \
  packages/webpack-plugin/test/platform/common/platform-diagnostic.spec.js \
  packages/webpack-plugin/test/ali-compat-style.spec.js \
  packages/webpack-plugin/test/web-compat-style.spec.js
```

完整构建用例若放在其他测试文件，同步加入命令范围。按仓库约束，单测失败最多尝试三次修复，仍失败则停止并输出错误与分析。

### 支付宝真机验收

| 场景 | 验收结果 |
| --- | --- |
| 父容器 nowrap，内部 text 无显式 white-space | text 按父级设置排版 |
| 全局或页面 `.title { white-space: normal }` | 同优先级用户规则能覆盖框架默认样式，确认宿主 `.a-text` 转换后的实际结果 |
| 外部样式、UnoCSS、scoped 与行内覆盖 | 仍保持预期级联，不因框架注入位置变化失效 |
| 根节点与 page 无用户覆盖 / 存在同优先级用户覆盖 | 无覆盖时维持原默认表现，有覆盖时以后加载的业务规则为准，旧追加规则不再反向覆盖 |
| 普通文本、嵌套 text、多行与图文混排 | 没有引入意外换行变化；省略号仍按业务布局设置判断 |
| 两个并列 scroll-view，仅一个声明 false | 只有目标容器滚动条被隐藏 |
| showScrollbar 从 true 切为 false 再切回 | 动态隐藏正常；移除隐藏类后回到宿主默认状态 |
| 嵌套滚动、原 class 与 wx:class 动态更新 | 内外层控制不串扰，业务类更新不会清掉框架条件类 |
| 横向与纵向滚动 | 内容仍能滚动，滚动事件、节点查询与定位能力不变 |

记录支付宝客户端、基础库、iOS / Android 与机型版本，至少选择能观察到原始滚动条的设备验证隐藏效果。“该机型本来就不显示”不能作为隐藏能力通过的证据。自动化检查实施结果见下文，真机矩阵尚未执行。

## UnoCSS 阶段调整实施记录

2026-09-23 已将 UnoCSS 小程序处理器改为读取 `compiler.webpack.Compilation.PROCESS_ASSETS_STAGE_ADDITIONS - 1`，并添加先于 Mpx 主插件处理的注释。主插件没有保留本轮尝试的 `+1` 修改；文本、滚动条适配及默认样式迁移的后续实施结果见下文。

- 修改文件的 ESLint 通过。
- 执行了一次禁用磁盘产物输出的真实 Webpack + Mpx + UnoCSS 构建检查：实际 UnoCSS tap 为 `-101`，生成的 CSS 与全局 import 在主插件构建映射生成之前可见，原有 JS 包装与默认 BannerPlugin 的相对顺序保持，source map 资产正常生成。此检查验证钩子及产物关系，不代替支付宝真机验证或完整分包矩阵。
- Jest 回归范围为 `global-object.spec.js`、`integration/require-async.spec.js`、UnoCSS 的 `plugin.test.js` 与 `rn-plugin.test.js`：17 项通过、2 项失败，6 个快照通过。
- 两个失败分别位于 `plugin.test.js:75` 与 `plugin.test.js:99`，都因当前生成器的 `uno.blocked` 为 `undefined`：前者调用 `not.toContain` 报收到空值，后者展开该字段时报不可迭代。这两个用例直接测试 RN UnoCSS generator，不执行本次改动的小程序 processAssets；本次修改 UnoCSS 前运行也出现同样失败，未扩展修改该无关问题。因此不能将本次回归描述为全部通过。

### UnoCSS 66.7.5 版本复验

2026-09-23 进一步确认，`unocss-plugin` 与 `unocss-base` 的 package.json 已将相关依赖精确限定为 `66.7.5`，但工作区 node_modules 实际解析到的版本仍为 `66.8.1`。直接创建 generator 对比：`66.7.5` 的 `blocked` 为 Set，`66.8.1` 的该属性为 undefined，与上述两个失败一致。

在独立临时目录安装全套相关 `66.7.5` 依赖，通过临时 Jest resolver 将原有测试中的 UnoCSS 模块统一解析到该目录，并记录实际解析路径，确认没有混入 `66.8.1`。未修改测试断言或框架实现，重跑 UnoCSS 两个测试套件后，5 个用例和 6 个快照全部通过，包含之前失败的两个用例。

因此精确使用 `66.7.5` 时不再出现上述失败；问题来自声明版本与本地安装版本不一致。本次为隔离版本验证，未改动项目依赖声明或锁文件，也未替换工作区原有 node_modules；直接使用原安装目录运行测试仍可能复现，需要实际重新安装到声明版本后才能消除。

## 方案实施记录

2026-09-23 已完成支付宝兼容样式资产、`show-scrollbar` 模板转换、Web 默认样式迁移、旧 style-compiler 注入与空样式请求清理，并同步更新跨端基础文档和本地小程序最佳实践 Skill。

- 相关 ESLint 通过。
- 新增测试与模板、平台诊断回归共 11 个测试套件、50 项测试全部通过。
- 完整构建测试覆盖无 App style、外部 style、内联 style、嵌套 import、自定义 App 输出目录、模拟 UnoCSS 前置注入与非支付宝目标。
- 自动化测试不能证明支付宝宿主内部滚动节点一定命中 `.mpx-scrollbar-hidden::-webkit-scrollbar`，仍需按本文真机矩阵完成并列、嵌套、横向和纵向滚动验收。

### 工作区依赖重装后的验证

随后按当前 package.json 完成工作区依赖重装，并同步本地 package-lock.json。安装前先备份锁文件，清除其中 `node_modules/lerna/node_modules/minipass-fetch/node_modules/encoding` 缺失版本号的无效记录，解决 npm 的 `Invalid Version` 错误；未修改 package.json 的版本声明。

工作区实际解析的 UnoCSS 相关直接依赖均已变为 `66.7.5`，`generator.blocked` 确认为 Set。使用工作区依赖直接运行上述四个 Jest 套件，无临时 resolver：19 个用例、6 个快照全部通过，之前两个失败已消失。修改过的 UnoCSS 插件文件 ESLint 通过。
