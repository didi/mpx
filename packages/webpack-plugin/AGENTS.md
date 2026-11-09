# @mpxjs/webpack-plugin

Mpx 的 webpack 构建插件。它不是独立编译器，而是**深度嵌入 webpack 编译流程**的一组扩展：插件类（[MpxWebpackPlugin](lib/index.js)）+ 一系列 loader（业务 rules 中通过静态工厂引入）+ 自定义 Dependency / Resolver Plugin / 子编译器，挂到 webpack 各 hook 上，把 `.mpx` 单文件拆解、编译、按目标平台（各类小程序 / Web / React Native）重新组装为可运行产物。

## 入口

业务侧通过 [lib/index.js](lib/index.js) 顶层导出的 `MpxWebpackPlugin` 接入，类上的静态工厂用于 `webpack.config.js`：

- `MpxWebpackPlugin.loader(opts)` → [lib/loader.js](lib/loader.js)，绑定到 `/\.mpx$/`（Web 模式下置于 vue-loader 之后）
- `MpxWebpackPlugin.nativeLoader(opts)` → [lib/native-loader.js](lib/native-loader.js)，原生 4 区块组件
- `MpxWebpackPlugin.wxmlLoader(opts)` / `wxssLoader(opts)` → 独立 wxml/wxss 类资源（含跨方言后缀）
- `MpxWebpackPlugin.wxsPreLoader(opts)` → wxs/qs/sjs/... 的 `enforce: 'pre'`
- `MpxWebpackPlugin.urlLoader(opts)` / `fileLoader(opts)` → 静态资源
- `MpxWebpackPlugin.pluginLoader(opts)` → 小程序插件工程入口
- 入口辅助：`getPageEntry / getComponentEntry / getNativeEntry / getPluginEntry`

包内三个核心入口：

- [lib/parser.js](lib/parser.js)：把 `.mpx`/`.vue` 拆为 `template/script/styles[]/json/wxs[]`，缓存按 `mode/env/path/content` 隔离
- [lib/config.js](lib/config.js)：跨端配置事实表（`typeExtMap`、模板/事件/wxs/组件差异），所有目标平台差异先来这里查
- [lib/helpers.js](lib/helpers.js)：`getRequire(type, part, extra, idx)` 把各 block 编排成 `<fakeRequest>!=!<selector>?...!<rawRequest>?mpx&type=...` 的内联 loader 链 request

## 核心模块

- [lib/loader.js](lib/loader.js) / [lib/selector.js](lib/selector.js) / [lib/extractor.js](lib/extractor.js)：主流程三件套——拆分调度 / block 选取 / 抽取为独立资产
- [lib/template-compiler/](lib/template-compiler/)：wxml AST 解析、跨端方言转换、render 函数生成（含 RN/JSX）、动态运行时模板
- [lib/style-compiler/](lib/style-compiler/)：基于 postcss 的 rpx/scoped/跨端单位/条件编译注释剥离
- [lib/json-compiler/](lib/json-compiler/)：app.json / page / component / theme / 小程序插件工程；**动态加 entry 的源头**
- [lib/wxs/](lib/wxs/)：wxs 模块化 + 模板引用（含独立的 webpack 子插件）
- [lib/wxml/](lib/wxml/) / [lib/wxss/](lib/wxss/)：独立 wxml / wxss 处理 + 产物侧 wxss 运行时
- [lib/script-setup-compiler/](lib/script-setup-compiler/)：`<script setup>` 支持
- [lib/web/](lib/web/) / [lib/react/](lib/react/)：mode 分别为 `web` / `ios|android|harmony` 时由 [loader.js](lib/loader.js) 调用，把 mpx 改写为 vue-loader 期望的 SFC / RN 用 JS 模块
- [lib/dependencies/](lib/dependencies/)：自定义 webpack Dependency，通过 `compiler.hooks.compilation` 注册。命名前缀对应职责：`*EntryDependency`（入口/分包）、`Record*Dependency`（资源/模块映射）、`Inject/Replace/ResolveDependency`（代码改写）、`CommonJs*Dependency`（require 协议扩展）
- [lib/resolver/](lib/resolver/)：自定义 enhanced-resolve 插件，按 mode/env 给请求加中缀、按 npm 包类型路由入口、按规则切到运行时渲染
- [lib/runtime/](lib/runtime/) / [lib/runtime-render/](lib/runtime-render/)：编译期被 require、产物里执行的运行时辅助；动态运行时渲染产物
- [lib/platform/](lib/platform/)：跨端转换规则表，由 `getRulesRunner({ type, mode, srcMode })` 在编译期消费，新增方言差异先看能否表达为规则
- [lib/utils/](lib/utils/)：构建期工具集，重点：`normalize`（loader 路径必经）、`parse-request` / `add-query`（request 操控）、`match-condition`（统一 include/exclude）、`set`（懒求值集合）、`env`（mode 判定）、`const`（关键字符串常量）

`compilation.__mpx__` 是上述模块共享的状态总线（loader 内 `this.getMpx()` 获取），承载 `pagesMap` / `componentsMap[packageName]` / `subpackagesEntriesMap` / `addEntry` / `getOutputPath` / `getExtractedFile` / `getPackageInfo` 等。详见 [lib/index.js](lib/index.js) 的 `compilation.__mpx__ =` 初始化块和 [lib/global.d.ts](lib/global.d.ts) 类型。

## 典型调用链

**A. `.mpx` → 平台产物**：webpack 命中 `.mpx` → [loader.js](lib/loader.js) 用 [parser.js](lib/parser.js) 拆 block，判定 `ctorType`，挂上 `Record*Dependency` → [helpers.js](lib/helpers.js) 为每个 block 生成子 request → webpack 在 `afterResolve` 阶段往子 request 链上 splice 进 [extractor.js](lib/extractor.js) 与对应 type 的子编译器（template/style/json/wxs）→ [extractor.js](lib/extractor.js) 在 pitch 阶段 `importModule` 取产物，写入 `module.buildInfo.assetsInfo.<file>.extractedInfo` → `compilation.hooks.beforeModuleAssets` 拼接所有 extractedInfo 并 `emitAsset` 输出最终 wxml/wxss/json，`processAssets` 阶段对 JS chunk 做小程序所需的包装。

**B. JSON 中 `pages/usingComponents` → 新 entry**：[json-compiler/](lib/json-compiler/) 解析 JSON，遍历 pages/subpackages/usingComponents/tabBar/workers，借 `DynamicEntryDependency` 推入 `mpx.subpackagesEntriesMap`，并通过 `RecordResourceMapDependency` 把"资源 → 输出路径"登记进 `mpx.pagesMap` / `mpx.componentsMap[packageName]`；`compiler.hooks.finishMake`（stage `-1000`）串行执行队列 `addEntry`，新发现的入口入队迭代直至清空。

**C. 跨端到 Web**：mode=`web` → [loader.js](lib/loader.js) 调 [web/index.js](lib/web/index.js) → 内部 `processTemplate/Script/Styles/JSON` 把 mpx 改写为 vue-loader 可消化的 SFC，业务方需自备 `vue-loader` + `MiniCssExtractPlugin` + `VueLoaderPlugin`；`processAssets` 阶段不做小程序 chunk 包装，splitChunks 改用 `main`(`/node_modules/`) + `async` 两组。

**D. 跨端到 React Native**：mode ∈ `ios|android|harmony` → [loader.js](lib/loader.js) 调 [react/index.js](lib/react/index.js) → 同名 `process*.js` 输出 RN 用 JS 模块；异步分包通过 `AsyncDependenciesBlock + ImportDependency` 实现，`runtimeRequirementInTree` 注入 [RetryRuntimeModule](lib/dependencies/RetryRuntimeModule.js)；chunk 在 `processAssets` 阶段被注入 `@refresh reset`、`__mpxPageConfigsMap` 与异步 chunk 缓存清理。

## 跨平台转换规则编写指南

`lib/platform/` 中的规则以 `srcMode` 选择源码方言规则表，以 `mode` 选择目标平台 processor。目前 template、style、JSON 均只有 `wx` 源码方言规则表，因此这里描述的是“微信语法输入 → 其他目标平台”的转换；目标平台相同但 `srcMode` 不是 `wx` 时不会经过这套规则。不要把 `mode` 当作源码方言，也不要在组件规则中自行实现另一套 `mode/srcMode` 判断。

### 先确定逻辑应该放在哪一层

| 需求 | 位置 | 输入与职责 |
| --- | --- | --- |
| 基础组件标签名差异、内建组件替换 | `platform/template/wx/component-config/<tag>.js` 顶层目标平台方法 | 接收 tag 名，返回目标 tag 名；可设置与标签选择直接相关的 `el.isBuiltIn` 等标记 |
| 某个基础组件的属性差异 | 同一组件配置的 `props` | 接收 `{ name, value }`，返回替换属性、属性数组或删除标记 |
| 某个基础组件的事件名差异 | 同一组件配置的 `event` | 接收不带 `bind/catch` 前缀的事件名，返回目标事件名或诊断 |
| 所有标签共享的指令、事件前缀、通用属性后处理 | `platform/template/wx/index.js` 的 `directive` / `preProps` / `postProps` / `event` | 只放真正跨组件共享的语法转换 |
| 不支持的基础组件 | `component-config/unsupported.js` | 输出统一诊断并阻止后续普通组件规则接管 |
| App/Page/Component JSON 字段转换 | `platform/json/wx/index.js` | 对 JSON 对象改名、删除、补充或递归处理字段 |
| RN 样式声明转换与校验 | `platform/style/wx/index.js` | 对 `{ prop, value, selector, decl }` 转换、展开或过滤 |
| 需要运行时组件模拟的能力 | 组件规则负责选择或标记，具体能力放 `runtime/components` | 不要在规则表中重建一套运行时组件逻辑 |

属性能力必须优先写在 `props` 中，不要塞进组件顶层的 `ali/web/...` 主转换器。标准化后的主转换器在属性列表重建完成后执行，契约是转换 tag 名，部分已有规则会顺带设置内建组件标记，不应在这里增删属性或维护 `attrsList/attrsMap`。

### 通用规则执行模型

[run-rules.js](lib/platform/run-rules.js) 是三类规则共用的执行器。一条规则通常形如：

```js
{
  test: 'source-name',
  ali (input, data, meta) {
    return transformedInput
  }
}
```

必须理解以下语义：

- `test` 可以是字符串、正则或函数；函数会以规则对象作为 `this`。未提供 `test` 时恒匹配，因此兜底规则必须放在最后。
- `testKey` 决定匹配 `input[testKey]` 还是整个 `input`。模板组件匹配 `tag`，模板属性匹配 `name`，RN 样式匹配 `prop`；JSON 使用自己的 `normalizeTest` 按对象是否拥有字段匹配。
- 命中 `test` 但没有当前 `mode` processor 时不会消费输入，而是继续检查后续规则。编排目标平台专用规则和通用兜底规则时可以利用这一语义。
- processor 通过 `processor.call(rule, input, data, meta)` 执行，因此可通过 `this.test` 读取当前规则配置。
- processor 返回 `undefined` 时保留当前输入；返回其他值时用结果替换当前输入。模板属性和 RN 样式中 `false` 表示删除，数组表示一项展开为多项。
- 默认首个实际执行了 processor 的规则后停止。仅当单条规则设置 `waterfall: true`，或 runner 传入 `waterfall: true` 时才继续执行后续规则。
- `data` 是调用侧上下文，并会附加 `mode`、`diagnostic`；`meta` 用于同一次规则链内部传递信息。不要用模块级可变变量传递单节点状态。
- 正则 `test` 不要使用 `g` / `y` 标志，否则反复调用 `.test()` 会受 `lastIndex` 影响。

返回值语义必须与调用侧匹配：

| 返回值 | 模板属性 | RN 样式 | JSON |
| --- | --- | --- | --- |
| `undefined` | 保留原属性 | 保留原声明对象 | 保留当前对象引用 |
| `false` | 删除属性 | 丢弃声明 | 不应使用；JSON processor 应返回对象 |
| 对象/字符串 | 替换属性对象；事件或 tag 场景可返回名称字符串 | 替换为一条声明 | 返回处理后的 JSON 对象 |
| 数组 | 展开为多个属性；来自 props 链的每项继续经过 `postProps`，directive 结果则直接汇总 | 展开为多条声明 | 不应作为顶层 JSON 规则结果 |
| `[]` | 消费并删除当前属性 | 不产生声明 | 不适用 |

只打印 warning/error 而不返回值会保留原输入。如果目标平台不能接受该输入，诊断后还必须显式返回 `false`、替换值，或在 JSON 中删除字段，不能误以为“打印提示”等同于删除。

### 模板组件规则的真实处理顺序

模板解析在 [template-compiler/compiler.js](lib/template-compiler/compiler.js) 中先执行条件属性处理，再调用平台规则。[normalize-component-rules.js](lib/platform/template/normalize-component-rules.js) 对命中的组件按如下顺序处理每个原始属性：

1. `spec.directive`
2. 指令未被任何 processor 消费时，执行 `spec.preProps`
3. 执行当前组件的 `cfg.props`
4. 对结果属性执行 `spec.postProps`；数组结果中的每一项分别执行
5. 汇总结果，统一重建 `el.attrsList` 和 `el.attrsMap`
6. 调用组件顶层的目标平台方法转换 tag 名

之后 compiler 才继续执行 scoped、条件与循环指令、class/style、事件、普通属性和渲染依赖收集等标准阶段。因此平台规则的输出必须保持这些阶段可消费的结构，不要在组件规则中重复实现后续 compiler 职责。

这里有几个容易出错的约束：

- `directive` 优先级高于 props。某属性一旦由 directive processor 处理，便不会再经过 `preProps/cfg.props/postProps`。事件属性属于公共 directive 规则，不要在 `props` 中按 `bindtap` 之类完整名称转换事件。
- 属性循环期间的 `el.attrsMap` 仍是进入该组件规则时的属性快照，外层会在全部属性处理完后统一重建。转换依赖同一节点的其他属性时从 `attrsMap` 读取；processor 应返回新的 attr/attrs 数组，不要直接维护 `attrsList` 和 `attrsMap`。
- 如果转换结果会与其他输入属性产生同名输出，应显式定义合并或替换策略，不能依赖源码属性顺序或最终重复属性去重的偶然结果。
- `processAtMode` 已在平台规则之前处理 `foo@ali`、`foo@wx` 等条件属性。被条件编译删除的属性不会进入组件规则，不要再次解析 `@mode`。
- 平台规则之后还会执行跨平台语法检测。已被规则正确转换的 `wx:` 指令不会误报；若绕开规则直接遗留其他平台前缀，则会产生警告或 RN 错误。

### 组件配置的各层契约

一个普通组件配置的结构如下：

```js
const TAG_NAME = 'example'

module.exports = function ({ print }) {
  const aliPropLog = print({ platform: 'ali', tag: TAG_NAME, isError: false })

  return {
    test: TAG_NAME,
    web (tag, { el }) {
      el.isBuiltIn = true
      return 'mpx-example'
    },
    props: [
      {
        test: 'source-prop',
        ali ({ value }) {
          return {
            name: 'target-prop',
            value
          }
        }
      },
      {
        test: 'unsupported-prop',
        ali: aliPropLog
      }
    ],
    event: [
      {
        test: 'change',
        ali () {
          return 'changeEnd'
        }
      }
    ]
  }
}
```

顶层配置：

- `test` 匹配原 tag。普通组件使用精确字符串；一组同构标签可使用正则或函数。
- 顶层 `ali/web/ios/...` 的输入是 `(tag, data)`，返回值应是目标 tag 名。没有标签差异就不要声明该方法。
- `supportedModes` 只用于限制该组件配置参与哪些目标，常见于 `unsupported.js` 或特殊规则；普通配置默认使用模板 spec 的全部目标。
- `skipNormalize: true` 表示完全绕过 directive/props/event 标准化，目标平台方法直接接收 `(el, data)` 并返回 AST 节点。只用于 `fix-component-name`、自定义内建组件这类必须接管整节点的前置规则。
- 顶层 `waterfall: true` 表示当前组件规则执行后继续匹配后续组件规则。`fix-component-name` 需要先修正名称再交给普通组件规则；一般组件不要开启。
- `component-config/index.js` 中的显式 catch-all 必须保持最后，使未命中基础组件表的标签也能执行公共 directive/event/props 流程。

`props` processor 的输入是属性对象 `{ name, value, loc... }`，第二个参数中可读取 `el`、当前原始 `attr`、`mode` 和诊断上下文。推荐做法：

- 改名或改值：返回新的 `{ name, value }`，不要原地修改输入。
- 一个源属性生成多个目标属性：返回数组，可参考 `button` 的 `open-type` 转换。
- 删除属性：返回 `false` 或 `[]`。
- 读取关联属性：从 `el.attrsMap` 获取原始值，返回完整转换结果；存在同名输出时显式处理合并或替换关系。
- 静态/动态表达式：复用 `parseMustacheWithContext`；仅在确有静态折叠需求时复用现有 `evalExp`，不要另写表达式求值器。动态表达式必须保留为后续 compiler 能识别的 mustache/目标语法。
- 规则按顺序执行，更具体的转换规则应放在更宽泛的兜底规则之前。仅为实际支持的目标声明 processor；未声明当前 mode processor 的规则不会截断后续匹配。

`event` 只处理事件名本身，例如 `scrolltoupper → scrollToUpper`。公共 directive 会拆解 `bind/catch/capture-*` 前缀和 modifier，再依次执行：

1. `spec.event.prefix` 转换前缀；
2. 当前组件 `event` 规则；
3. 组件未命中时再使用公共 `spec.event.rules`。

组件 event 规则位于公共事件规则之前，所以可以覆盖通用事件映射或对当前组件报不支持。不要在 event processor 中返回完整的 `onXxx` 属性名，前缀拼装由公共规则负责。

### JSON 规则

JSON 使用 [platform/json/normalize-test.js](lib/platform/json/normalize-test.js) 判断对象是否拥有字段。`test: 'a|b'` 表示当前对象包含 `a` 或 `b`，命中的字段名会记录到 `meta.paths`。App 使用 `spec.rules`；Page 使用 `spec.page`；Component 使用 `spec.component`。

JSON runner 默认由调用方设置 `waterfall: true`，所以所有命中规则都会按顺序执行。典型 processor 应直接修改同一个对象并返回它：

```js
{
  test: 'sourceKey',
  ali (input) {
    return changeKey(input, this.test, 'targetKey')
  }
}
```

编写 JSON 规则时：

- 字段改名复用 `changeKey`；不支持字段复用现有 `deletePath` 生成器，确保 warning/error 格式一致。
- 多条规则可依次处理同一对象，规则顺序即转换顺序。不要按模板规则“首个命中即结束”的直觉编写 JSON。
- `window`、`tabBar`、`tabBar.list` 等嵌套对象通过显式 `runRules` 递归处理，并传入 `pathArr` 与同一个 `diagnostic`，否则错误无法定位到完整 JSON 路径。
- 需要跨规则传递结果时使用 runner 的 `meta`，例如全局组件兼容；不要挂全局变量。
- App/Page/Component 的规则集合不同。新增字段前先确认它属于根配置、页面 window 字段还是组件配置，避免放错 `rules/page/component`。

### RN style 规则

style 规则目前只对 `ios/android/harmony` 生效，输入为：

```js
{
  prop,
  value,
  selector,
  decl
}
```

runner 以 `prop` 匹配且默认不 waterfall，因此必须把专用格式化规则放在通用简写和最终校验规则之前。processor 可以返回：

- `{ prop, value }`：单条声明；
- `[{ prop, value }, ...]`：简写展开；
- `false`：过滤不支持或非法声明；
- `undefined`：保留原声明。

最终兜底验证规则 `test: () => true` 必须保持在最后。新增简写时先确认是否应进入 `AbbreviationMap`、是否顺序敏感、是否需要缺省值补齐；不要只加一个正则分支绕过既有验证。诊断时保留输入的 `decl`，`createDiagnostic` 会据此生成 CSS 源码位置；selector 限制和 AtRule 诊断由 `react/style-helper.js` 的外层流程处理。

### 诊断规范

所有平台规则都应使用 spec 注入的 `warn/error` 或组件配置的 `print`，禁止直接 `console.warn/error`。诊断层会自动补充：

- 当前 `srcMode → mode`；
- 模板属性、CSS 声明或 JSON 路径；
- 文件和源码位置；
- 有 source map 时的原始源码 code frame。

组件属性、事件、值和不支持标签优先复用 `component-config/index.js` 的 `print`，保持现有措辞与 warning/error 等级。JSON 自定义诊断应传 `{ path, value }`，style 自定义诊断应保留 `decl/node/target`。不要把文件名、行号或模式手工拼进消息正文。

### 实施与测试清单

新增或修改规则时按以下顺序检查：

1. 确认真实输入方言是 `wx`，目标平台在对应 spec 的 `supportedModes` 中。
2. 按“tag / props / event / directive / JSON / style”职责选择最窄接入点，优先模仿相邻组件已有规则。
3. 检查规则顺序：更具体的规则在更宽泛的兜底规则之前，catch-all 和验证规则在最后；需要连续执行时才使用 waterfall。
4. 明确 processor 返回值，特别区分“仅诊断并保留”与“诊断后删除”。
5. 模板属性转换只返回 attr 或 attrs 数组，由外层重建 `attrsList/attrsMap`；涉及多个输入属性时显式处理合并关系，并验证结果不依赖源码属性顺序。
6. 验证转换产物能够继续被后续 compiler 阶段正常消费，重点覆盖本次规则涉及的表达式、指令或关联属性。
7. 模板测试放在 `test/platform/wx/template/`，复用 `compileTemplate`；JSON 复用 `compileJson` 或直接构造 `getRulesRunner`；RN style 通过 `getClassMap` 验证。
8. 同时断言转换产物和 warning/error；新增诊断时至少覆盖目标、模式和源码位置。涉及完整 loader/构建时序时再补 integration 构建测试。
9. 完成后执行相关 ESLint 与 Jest；不要用快照代替关键属性、表达式和诊断语义断言。
