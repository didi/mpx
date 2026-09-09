# Mpx Skill 能力证据矩阵

## 用途与审计口径

本矩阵是候选 `.agents/skills/mpx` 的事实索引。先在这里登记候选结论和证据，再同步正式 reference。`base` 负责能力定义与公共写法；平台层只记录支持度、目标转换、额外限制、宿主依赖和替代方案。能力进入 Base 不等于宣称每个目标都完整支持。

- 审计日期：2026-07-21
- 实现事实来源：当前工作树中的编译器、运行时、platform rules、后缀实现和测试
- 候选 Skill：`.agents/skills/mpx`
- 回退基线：`.agents/skills/mpx2rn`，本次未修改
- `pending` 项不会进入正式能力 reference

## 平台与构建边界

| 目标 | 当前实现结论 | 证据 |
| --- | --- | --- |
| 小程序 | `isMiniProgram(mode)` 定义为非 Web、非 React；wx-source platform specs 列出 ali/swan/qq/tt/ks/jd/qa/dd 等目标 | `packages/webpack-plugin/lib/utils/env.js`；`lib/platform/template/wx/index.js`；`lib/platform/json/wx/index.js` |
| 支付宝 | 独立 `mode=ali`，有 `.axml/.acss` 配置、platform rules、core ali patch 与 API `.ali.js` | `lib/config.js`；`lib/platform/**/wx/`；`packages/core/src/platform/patch/*.ali.js`；`packages/api-proxy/src/platform/api/**/*.ali.js` |
| Web | 独立 `mode=web`，当前要求 `srcMode=wx`，SFC 进入 `lib/web/` 分支 | `lib/index.js` 构造校验；`lib/loader.js`；`lib/web/process*.js` |
| RN | `ios/android/harmony` 由 `isReact` 识别，共享 `lib/react/` 分支 | `lib/utils/env.js`；`lib/index.js`；`lib/loader.js`；`lib/react/process*.js` |
| Skyline | 不是 mode，是微信页面 JSON renderer；仓库专项逻辑只按 `renderer='skyline'` 和 Skyline 子包检查 | `packages/size-report/src/SizeReportPlugin.js` 的 `skylineSubpackages` 分支 |

## 旧 RN Skill 基线

### 行为基线

`.agents/skills/mpx2rn-workspace/iteration-8/result.md` 记录 6 个 eval、63 条断言：旧 Skill 得分 60/63，no-skill 得分 39/63。旧 Skill 的 eval-1、eval-2、eval-3 均满分。本次阶段一至六不运行候选行为评测，后续阶段七仍以该结果为比较基线。

### 文件快照

旧 `SKILL.md` frontmatter 版本为 `2.11.0`。以下为实施前 SHA-256：

| 文件 | SHA-256 |
| --- | --- |
| `SKILL.md` | `a4dca04cd49687f4c85829a7000e89c521e228abccaf7c0227072d3bd2bff3a5` |
| `references/conditional-compile.md` | `39caea2aa9a49aa691ea7c7ef490058ba83f134322dd2a386f0472ce27d57970` |
| `references/rn-api-reference.md` | `15ee276b61af73f02144e7bdf8ce3c864287bbf6e36bcf1f05250e7ad422143c` |
| `references/rn-atomic-css.md` | `c61c7bf93bb28ddb0ab870de0e218ed7adb009349df1150caf4454c8137a0583` |
| `references/rn-hybrid-dev.md` | `d6ccea9bd5611b39cf7f3ce5396795f7d74a88b7b1081875ee0350cbeb9eaa97` |
| `references/rn-json-reference.md` | `44771a1b84f4a3530ac219eb6f05eebdb7c6a3cfe323d0b945ba07031ec2a1bb` |
| `references/rn-script-reference.md` | `ad3366a21efc49a39a5851a02a8671ee3e0650bed6ebb74f750b930be22a8eee` |
| `references/rn-style-practice.md` | `359789b053c9be9cdc8910795f76c52bdda6acd2aa3e7f8264cc24685c0245a5` |
| `references/rn-style-reference.md` | `62372bf62310bb130ecead1d718a0cc492e660904df69e9b69a3e2661538d0c6` |
| `references/rn-template-reference.md` | `27fc4b09568c02807d172cfb295241d17e8abf9412d3eefa4e590c99cd528e11` |
| `references/single-file-component.md` | `ad23cf23d700a993b3ccf69f5487ccd82015f121fe888c2feb14877d438ad3ce` |
| `scripts/compile-validate.js` | `380871006e4ca74f2d56737b58eb2aa1bf196038a2d1f88bd1792e73b63e2e8a` |
| `scripts/strip-using-components-loader.js` | `c2faa7ac753b9f45947cadfdaf6ae098eec0bb162b49bc58c80a9281676881cc` |

## 能力矩阵

表中 `source` 是候选来源，`implementation_evidence` 使用路径与符号而非行号。`test_evidence` 为 `—` 时，只允许写入低风险的编译入口结论，不能扩大为运行行为。

| id | dimension | candidate | source | implementation_evidence | test_evidence | platform_scope | classification | reason | target_reference |
| --- | --- | --- | --- | --- | --- | --- | --- | --- | --- |
| BUILD-001 | build | Web 是独立目标且要求微信源模式 | 方案/实现 | `webpack-plugin/lib/index.js` 的 Web/srcMode 构造校验；`lib/loader.js` 的 `mode === 'web'` 分支 | `template-compiler/web-template.spec.js` | web | web | 属于 Web 编译边界，不是公共语法 | `web/guide.md` |
| BUILD-002 | build | RN 目标是 ios/android/harmony，共享 React 分支 | 旧 Skill/实现 | `lib/utils/env.js#isReact`；`lib/loader.js` 的 `processReact` 分支 | `template-compiler/rn-template.spec.js`、`rn-process-template.spec.js` | ios/android/harmony | rn | 明确的目标集合和分发入口 | `rn/guide.md` |
| BUILD-003 | build | ali 是独立 mode | 方案/实现 | `lib/config.js#ali`；template/json specs 的 `supportedModes` | `platform/common/mode.spec.js` | ali | ali | 有独立方言配置和规则 | `ali/guide.md` |
| BUILD-004 | build | Skyline 是 renderer，不是 mode | 方案/实现 | `size-report/src/SizeReportPlugin.js` 的 `skylineSubpackages` 与 `pageJson.renderer` | — | wx/skyline profile | skyline | 只能按微信 JSON/产物验证 | `skyline/guide.md` |
| SFC-001 | sfc | template/script/style/json/custom block 使用共同解析器 | 旧 SFC 文档/实现 | `template-compiler/compiler.js#parseComponent` 固定返回结构；`lib/parser.js` 缓存包装 | — | all parsed targets | base | 只声明共同解析入口，不声明区块内部语义 | `base/single-file-component.md` |
| SFC-002 | sfc | loader 在目标分流前解析同一份 SFC | 实现 | `lib/loader.js` 先 `parseComponent`，后 `processWeb/processReact/mini-program` | — | mini/web/rn | base | 编译链可达证据明确 | `base/single-file-component.md` |
| SFC-003 | sfc | mode/env 可选择或覆盖 SFC 区块 | 实现 | `compiler.js#parseComponent` 的 block priority 与 style 过滤 | — | all parsed targets | base | 纯编译期选择规则 | `base/single-file-component.md` |
| SFC-004 | json | `<script name="json">` 作为动态 JSON 入口 | 旧 Skill/实现 | `parseComponent` 将 `name=json` 标记 `useJSONJS`；loader `preProcessJson` | iteration-8 eval-3/5 断言覆盖 RN 用法 | mini/web/rn | base | 入口通用，字段支持仍属平台层 | `base/json.md` |
| TPL-001 | template | `wx:if/elif/else` 进入微信产物与 RN 转换 | 实现/测试 | template compiler 与 wx-source directive rules | `platform/common/wx-if.spec.js` | wx/rn；ali/web 由 rules 可达 | base | 条件指令有直接测试，平台输出方言另记 | `base/template.md` |
| TPL-002 | template | 节点/属性 `@mode`、`@_mode`、`mpxTagName@mode` | 旧条件编译/实现 | template compiler mode attribute handling | `platform/common/mode.spec.js` 覆盖 wx/ali/web | mini/web/rn | base | 编译期能力；目标专属属性本身不通用 | `base/template.md`、`base/conditional-compile.md` |
| TPL-003 | template | Mpx 事件源语法、内联传参与动态事件名；目标事件传播存在差异 | 实现/旧 RN reference | template compiler event parser；`platform/template/wx/index.js` event rules | `platform/common/mode.spec.js`；`platform/wx/template/event-rn.spec.js` | mini/web/rn | base+platform | 源语法定义归 Base；可捕获事件、冒泡与降级行为归目标 | `base/template.md`、`rn/template.md` |
| TPL-004 | template | ali 指令与事件方言为 `a:*`、`onXxx/catchXxx` | config/实现 | `lib/config.js#ali.directive/event`；template wx rules 的 ali handler | `platform/common/mode.spec.js` | ali | ali | 明确平台方言 | `ali/template.md` |
| TPL-005 | template | Web 把 `wx:*` 转为 Vue 指令，catch/capture 转 modifier | 实现 | `platform/template/wx/index.js` 的 web handlers；`web/processTemplate.js` | `template-compiler/web-template.spec.js` | web | web | Web 专属输出语法 | `web/template.md` |
| TPL-006 | template | 基础组件源契约与 RN 组件/属性/事件支持矩阵 | 旧 RN reference/实现 | `react/processTemplate.js`；`platform/template/wx/component-config/`；RN runtime components | iteration-8 eval-1/3；RN template tests | mini/web/rn | base+rn | 组件用途和公共 API 定义归 Base；RN 支持集合、扩展属性、原生依赖和限制归 RN | `base/components.md`、`rn/template.md` |
| SCR-001 | script | `@mpxjs/core` 提供共同构造器与响应式入口 | 正式实现 | `packages/core/src/index.js` 导出；`src/core/`、`src/observer/` | `core/__tests__/common/` | mini/web/rn | base | 共同编程模型成立；具体 hook/option 不随之通用 | `base/script.md` |
| SCR-002 | script | 生命周期存在公共模型并由平台 patch 映射 | 实现 | core lifecycle constants/composition exports；`platform/patch/getDefaultOptions.*.js`；`patch/lifecycle/index.*.js` | core common tests | ali/web/rn/mini | base+platform | 生命周期定义与三类写法归 Base；触发时机、缺失宿主事件与特殊 hook 归平台 | `base/script.md`、各平台 `script.md` |
| SCR-003 | script | ali props/data/methods/behaviors 与生命周期适配 | 实现 | `getDefaultOptions.ali.js#filterOptions/initProxy`；`lifecycle/index.ali.js` | — | ali | ali | 支付宝运行时专属差异 | `ali/script.md` |
| SCR-004 | script | 响应式、Composition API、script setup、运行时导出、Fetch、Pinia/Store 与 RN 差异 | 旧 RN reference/实现 | core composition/runtime；fetch/pinia/store；`getDefaultOptions.ios.js`；React runtime | core common tests；iteration-8 eval-2/3/5 | mini/web/rn | base+rn | 通用模型全部迁 Base；RN 仅保留 React 映射、selector/ref、rnConfig 与不支持事件 | `base/script.md`、`rn/script.md` |
| SCR-005 | script | Web script 走独立组装与 Web patch | 实现 | `web/processScript.js`；`core/platform/patch/*.web.js` | `core/__tests__/web/` | web | web | Web 路由/生命周期差异 | `web/script.md` |
| STYLE-001 | style | 所有目标从共同 style loader 进入后续平台流程 | 实现 | `style-compiler/index.js`；`web/processStyles.js`；`react/processStyles.js` | `platform/common/style-strip-condition.spec.js` | mini/web/rn | base | 只描述入口，不描述 CSS 支持矩阵 | `base/style.md` |
| STYLE-002 | style | `@mpx-if/elif/else/endif` 使用 defs 做样式裁剪 | 旧条件编译/实现 | `style-compiler/strip-conditional.js`；`plugins/conditional-strip.js` | `style-strip-condition.spec.js` 与 fixtures | mini/web/rn | base | 有公共实现与测试 | `base/conditional-compile.md` |
| STYLE-003 | style | `rpx` 在所有目标核心语义完全一致 | 旧 RN reference/文档 | `style-compiler/plugins/rpx.js`、`vw.js`、RN style transform | 目标测试不完整 | all | pending | 转换策略受 mode/config 影响，不写入 base 不变量 | — |
| STYLE-004 | style | ali scoped/root 特殊处理 | 实现 | `style-compiler/index.js` 的 ali `scopeId/transSpecial` 与 app root 补丁 | — | ali | ali | 明确的 ali 分支 | `ali/style.md` |
| STYLE-005 | style | Web scoped、特殊选择器与 rpx→vw 处理 | 实现 | `style-compiler/index.js` 的 web 分支；`web/processStyles.js` | — | web | web | Web 专属输出 | `web/style.md` |
| STYLE-006 | style | RN 选择器、属性、单位、动画等支持矩阵 | 旧 RN reference/实现 | `react/processStyles.js`；`platform/style/wx/`；RN runtime style helpers | iteration-8 eval-0/3/4/5；RN style/runtime tests | rn | rn | 高风险矩阵完整保留在 RN 层 | `rn/style.md`、`rn/style-practice.md` |
| STYLE-007 | style | 静态 class/style、`wx:class`/`wx:style` 与公共样式复用 | 旧 RN reference/实现 | template/style compiler；style loader | RN template/style tests | mini/web/rn | base | 写法和绑定模型不属于 RN；目标 CSS 能力仍由平台矩阵限定 | `base/style.md` |
| JSON-001 | json | JSON 在目标分流前共同预处理，之后平台转换 | 实现 | `loader.js#preProcessJson`；`platform/json/wx/`；`web/react processJSON` | `platform/wx/json/*.spec.js` | mini/web/rn | base | 只描述流水线 | `base/json.md` |
| JSON-002 | json | `usingComponents` 是共同依赖入口但会被目标修正 | 实现 | `pre-process-json.js`；wx JSON componentRules；Web/RN processJSON | JSON specs、template tests | mini/web/rn | base | 公共入口与平台差异同时明确 | `base/json.md` |
| JSON-003 | json | ali window 字段重命名/删除 | 实现 | `platform/json/wx/index.js#windowRules` ali handlers | `platform/wx/json/page.spec.js` | ali | ali | 支付宝专属字段转换 | `ali/json.md` |
| JSON-004 | json | ali tabBar 键名转换 | config/实现 | `config.js#ali.tabBar`；JSON spec `tabBar` ali rules | `platform/wx/json/app.spec.js` | ali | ali | 支付宝专属结构 | `ali/json.md` |
| JSON-005 | json | packages、异步组件/JS、preloadRule、抽象节点及 RN 容器差异 | 旧 RN reference/实现 | package processing；`react/processJSON.js`；wx JSON react rules | iteration-8 eval-2/3/4/5 | mini/web/rn | base+rn | 分包/泛型配置契约归 Base；RN 字段支持、chunk loader 与 fallback 归 RN | `base/json.md`、`rn/json.md` |
| JSON-006 | json | Web JSON 转为路由/运行时配置 | 实现 | `web/processJSON.js`；wx JSON web rules | Web template/runtime tests | web | web | Web 专属组装 | `web/json.md` |
| JSON-007 | json | Skyline 页面 `renderer` 与子包一致性 | 方案/实现 | `SizeReportPlugin.js` 的 `skylineSubpackages`、`pageJson.renderer` | — | wx/skyline profile | skyline | 当前唯一明确的 Mpx 仓库专项证据 | `skyline/json.md` |
| API-001 | api | api-proxy 提供统一安装、Promise 和 custom mode 注入入口 | 实现 | `api-proxy/src/install.js#install/getProxy` | api-proxy web/rn tests | mini/web/rn | base | 调用契约通用，逐 API 支持不通用 | `base/api.md` |
| API-002 | api | ali API 通过 `.ali.js` 或默认实现分发 | 实现 | `api-proxy/src/platform/api/**/*.ali.js`；platform index exports | — | ali | ali | 逐 API 查实现，不建立未经审计总表 | `ali/api.md` |
| API-003 | api | Web API 使用 `.web.js` 并有专项测试 | 实现/测试 | `api-proxy/src/platform/api/**/*.web.js` | `api-proxy/__tests__/web/` | web | web | 已验证的 Web 差异入口 | `web/api.md` |
| API-004 | api | API 通用调用/参数契约与 RN 支持、原生依赖、权限差异 | 旧 RN reference/实现 | `api-proxy/src/install.js`；`api-proxy/src/platform/api/**/*.ios.js` 与 RN helpers | api-proxy common/RN tests；iteration-8 eval-2 | mini/web/rn | base+rn | 安装、Promise、API 契约归 Base；RN 可用集合和目标差异归 RN | `base/api.md`、`rn/api.md` |
| UNO-001 | style/build | Mpx UnoCSS 通用接入与 RN utility/variant 支持范围 | 旧 RN reference/实现 | `packages/unocss-plugin/`、`packages/unocss-base/` | `unocss-plugin/__tests__/plugin.test.js` | mini/web/rn | base+rn | presetMpx、token/safelist、directive/group 归 Base；RN 支持矩阵与诊断归 RN | `base/atomic-css.md`、`rn/atomic-css.md` |
| HYBRID-001 | script/template | `.mpx` 与 RN 原生组件/Hooks 混合开发 | 旧 RN reference/实现 | React 编译/runtime 与文件后缀分发 | — | rn | rn | RN 专属依赖与隔离方式 | `rn/hybrid-development.md` |
| SKY-001 | template/style | Mpx 对 Skyline 组件和样式有完整专项支持矩阵 | 未来候选 | 未找到足够的 Mpx 专项实现/测试 | — | skyline | pending | 宿主支持不能替代 Mpx 实现确认 | — |
| BASE-001 | api/template/style/json | 微信公开基础知识应完整复制进 Skill | 旧文档候选 | 不属于 Mpx 专属实现证据 | — | wx | pending | 默认依赖模型已有知识，只保留解释 Mpx 转换所需最短上下文 | — |

## 待确认清单

以下结论不进入正式 reference，后续新增证据时先更新矩阵：

1. `rpx`、CSS 变量、媒体查询等样式能力在所有小程序/Web/RN/Skyline 下的完全等价语义；
2. Skyline 的完整组件、模板指令、样式属性、事件和环境 API 支持矩阵；
3. 任何未逐目标核对的生命周期、实例方法、JSON 字段和 api-proxy API；
4. 其他小程序目标相对于 `base` 的独立差异层；
5. 仅由旧 Skill 或正式文档陈述、但当前实现和测试尚未复核的通用结论。

## RN → Base 深度抽离审计

| 原 RN 内容 | 新归属 | RN 保留内容 |
| --- | --- | --- |
| 数据绑定、指令、事件源语法、slot、动态组件、WXML 模板、i18n、无障碍源语法、公共模板配置 | `base/template.md` | 触摸传播限制、selector/ref、RN 无障碍验证、customBuiltInComponents |
| 基础组件用途、公共属性/事件定义 | `base/components.md` | RN 支持集合、扩展属性、原生依赖与限制 |
| 构造模型、实例 API 定义、响应式、Composition API、script setup、生命周期主模型、运行时导出 | `base/script.md` | React 生命周期映射、不支持页面事件、selector/ref、React Hooks、rnConfig |
| Fetch、拦截器/取消、Pinia、Store 完整示例 | `base/fetch-and-state.md` | 仅保留 RN 请求底层差异在 `rn/script.md` |
| 静态/动态样式绑定、条件裁剪、公共样式复用 | `base/style.md` | RN selector、单位、属性、函数、动画支持矩阵和 RN 改造方案 |
| UnoCSS 接入、presetMpx、完整 token/safelist、alpha、directives、variant groups | `base/atomic-css.md` | RN utility/variant 范围、RN 编译诊断 |
| JSON 入口、packages、`?root`/`?resolve`、异步组件/JS、preloadRule、懒加载监听、抽象节点 | `base/json.md` | RN 字段表、scroll-view 替代、chunk loader、asyncChunk/fallback、页面错误回调 |
| api-proxy 安装/Promise/Task 与支持度判定 | `base/api.md` | RN 可用集合、返回差异、原生依赖、BLE/Wi-Fi 权限、selector 查询限制 |
| 逐 API 入参、回调和返回表 | `base/api-catalog.md` | 目录不承担目标支持结论 |

## 同步规则

- 实现变化时先更新本矩阵，再更新 `.agents/skills/mpx/references/`。
- `base` 负责能力定义，但不得把定义误写成全目标支持结论；支持判断仍需平台证据。
- 平台 reference 只描述相对 `base` 的支持度、扩展、限制、转换与验证方式。
- 阶段七行为评测通过前，不修改活跃 Skill 入口或旧 `mpx2rn`。
