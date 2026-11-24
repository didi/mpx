# Mpx Skill 执行方案

## 背景

当前 `mpx2rn` Skill 同时维护了两类知识：

- Mpx 在多个输出平台均可使用的通用技术特性；
- RN 平台的能力边界、特异性和适配指南。

除现有 RN 知识外，后续还需要系统沉淀支付宝小程序、Web 与 Skyline 知识。如果继续创建彼此独立且自包含的平台 Skill，会产生公共知识重复、Skill 间依赖和多 Skill 同时加载时的上下文冗余。

本方案将这些能力收敛到一个 `mpx` Skill，通过 `base/ali/rn/web/skyline` 五层 references 进行渐进式加载：

- `base` 维护跨目标平台都可使用、语义稳定的通用技术特性；
- `ali`、`rn`、`web`、`skyline` 只维护各自的平台特异性、能力限制与适配指南；
- 根 `SKILL.md` 只负责触发、任务识别和知识路由，不重复承载详细能力矩阵。

`base` 的内容不能从旧 Skill 文案直接推断。实施时必须结合当前仓库的编译器、运行时、平台分发代码和测试逐项判断，以代码实现为主要事实来源。

## 已确定的设计结论

1. 只保留一个活跃 Skill：`mpx`，不建立需要同时触发的多个平台 Skill。
2. references 使用 `base/ali/rn/web/skyline` 结构，不建立 `wx` 目录。
3. 微信小程序公开基础知识默认不重复建设；当其是解释 Mpx 能力、跨平台一致性或适配边界所必需的上下文时，可以按最小必要原则纳入。
4. `base` 不是“Mpx 基础教程”，而是跨平台通用能力契约。
5. 平台目录不复制 `base` 的定义，只描述相对 `base` 的扩展、限制、偏差和适配方式。
6. reference 文件按平台和 template、script、style、json、API 等维度按需加载，未命中的文件不进入上下文。
7. 旧 `.agents/skills/mpx2rn` 在新 Skill 完成评测和切换前保持不变，作为效果基线与回退来源。

## 目标

1. 建立一份无运行时 Skill 依赖、无公共知识重复维护的 Mpx Skill。
2. 准确划分 `base` 与平台特异知识，确保每条通用结论均有仓库实现或测试证据。
3. 保持当前 `mpx2rn` 的 RN 开发、适配、排错和 Review 能力不回退。
4. 为支付宝小程序、Web、Skyline 提供稳定的知识目录与审计流程，不提前填充未经验证的结论。
5. 通过渐进式加载降低单平台任务的上下文消耗，并让多平台任务只读取一次 `base`。

## 非目标

1. 不重新编写微信小程序公开教程、组件文档或宿主 API 文档。
2. 不因目录结构对称而强制让支付宝小程序、RN、Web、Skyline 具备完全相同的文件和内容。
3. 不在缺少实现或测试证据时，把“看起来应该跨端可用”的能力写入 `base`。
4. 本次只调整 Skill 知识组织，不修改 Mpx 编译、运行时或对外 API。
5. 新 Skill 未完成行为评测前，不删除、覆盖或降低旧 `mpx2rn` 的可用性。

## 目标目录

```text
.agents/skills/mpx/
├── SKILL.md
├── references/
│   ├── base/
│   │   ├── guide.md
│   │   ├── single-file-component.md
│   │   ├── template.md
│   │   ├── script.md
│   │   ├── style.md
│   │   ├── json.md
│   │   ├── api.md
│   │   └── conditional-compile.md
│   ├── ali/
│   │   ├── guide.md
│   │   ├── template.md
│   │   ├── script.md
│   │   ├── style.md
│   │   ├── json.md
│   │   └── api.md
│   ├── rn/
│   │   ├── guide.md
│   │   ├── template.md
│   │   ├── script.md
│   │   ├── style.md
│   │   ├── style-practice.md
│   │   ├── atomic-css.md
│   │   ├── json.md
│   │   ├── api.md
│   │   └── hybrid-development.md
│   ├── web/
│   │   ├── guide.md
│   │   └── 按已验证能力逐步增加维度文件
│   └── skyline/
│       ├── guide.md
│       └── 按已验证能力逐步增加维度文件
├── scripts/
│   ├── compile-validate.js
│   └── strip-using-components-loader.js
└── evals/
    └── evals.json
```

目录表达知识分类，不代表实现架构对称：

- 支付宝小程序是 `mode=ali` 的独立编译目标，主要差异分布在跨端配置表、platform rules、core platform patch 和 API 的 `.ali.js` 后缀实现中；
- Web 是 `mode=web` 的独立编译目标；
- RN 使用 `mode=ios|android|harmony`，共享 React 编译链并存在端内差异；
- Skyline 不是当前 `__mpx_mode__` 的独立值，而是微信产物中的 renderer 配置，验证方式应基于微信构建产物、页面 JSON 和 Skyline 运行约束，不能照搬 Web/RN 的 mode 判断方式。

## `base` 的定义与准入规则

### 定义

`base` 记录一份 Mpx 源码在目标平台上都能成立的公共语法、能力契约和开发原则。它描述“这项能力如何通用地使用”，而不是罗列每个平台的支持矩阵。

### 准入条件

候选能力只有同时满足以下条件，才能进入 `base`：

1. **源码层通用**：业务代码无需依赖某个平台专属属性、API、组件或配置。
2. **编译链可达**：仓库实现能证明该语法会进入支付宝等小程序、Web、RN 以及涉及 Skyline 的微信构建流程。
3. **运行语义稳定**：各目标平台的运行时实现保持核心语义一致；仅语法相同但行为显著不同，不视为通用。
4. **无需平台隔离**：正常使用不要求通过 `__mpx_mode__`、文件后缀或平台属性后缀才能成立。
5. **存在证据**：至少有明确实现入口；高风险能力还需要测试、fixture 或可复现编译结果支持。
6. **无已知反例**：平台规则、后缀实现、测试或现有问题记录中不存在与该通用结论冲突的限制。

### 拆分规则

当一项能力只有部分语义通用时，拆成公共定义与平台差异：

```text
base/template.md
  定义通用语法、输入输出与跨平台不变量

ali/template.md
  记录支付宝小程序的方言差异、限制和适配方式

rn/template.md
  记录 RN 支持范围、限制和替代方案

web/template.md
  记录 Web 编译或运行差异

skyline/template.md
  记录 Skyline renderer 下的限制或增强
```

如果无法证明某项结论在全部目标平台成立：

- 不放入 `base`；
- 放入已有证据对应的平台目录；
- 证据仍不足时写入能力审计清单的“待确认”状态，不进入正式 reference。

微信原生 WXML、WXSS、组件和宿主 API 的通用公开知识不是进入 `base` 的硬性拦截条件。默认依赖模型已有知识以控制上下文体积；如果缺少该知识会影响 Mpx 特性理解、跨平台判断或正确实现，则补充完成任务所需的最短说明。

### 不进入 `base` 的内容

- 只在某个平台存在的生命周期、组件属性、配置字段或环境 API；
- 需要条件编译才能正确工作的能力；
- 仅由旧 Skill、历史文档或经验描述支持，但无法在当前实现中确认的结论；
- 原生 RN、浏览器或微信声称支持，但 Mpx 编译链尚未支持的能力。

## 能力事实来源与证据优先级

每项能力按照以下优先级取证：

1. 当前仓库中的编译和运行时代码；
2. 与实现直接对应的 Jest 测试、fixture 和真实编译产物；
3. 当前仓库 `docs-vitepress/` 中的正式文档；
4. 旧 `mpx2rn` Skill 与历史评测结果，仅作为候选清单和回归基线；
5. 平台官方资料，用于补充宿主侧行为，不能替代对 Mpx 实现的确认。

证据冲突时以当前实现和可重复测试为准，并记录文档或旧 Skill 的待修正项。不能因为 RN 原生、浏览器或微信 Skyline 原生具备某能力，就推断 Mpx 已经支持。

## 代码审计入口

实施阶段按维度从以下入口建立能力证据链。

| 维度 | 主要实现入口 | 重点判断 |
| --- | --- | --- |
| 平台与 mode | `packages/webpack-plugin/lib/config.js`、`lib/utils/env.js`、`lib/loader.js`、`packages/core/src/convertor/` | 支持的 mode、Web/RN 独立分支、小程序默认分支、源平台到目标平台的转换关系 |
| SFC | `packages/webpack-plugin/lib/parser.js`、`lib/loader.js`、`lib/selector.js`、`lib/helpers.js` | 四区块是否走共同解析流程，各平台是否重新组装或丢弃区块 |
| Template | `lib/template-compiler/`、`lib/platform/template/wx/`、`lib/web/processTemplate.js`、`lib/react/processTemplate.js` | 指令、事件、slot、template、组件属性在目标平台的转换和限制 |
| Script | `lib/script-setup-compiler/`、`lib/web/processScript.js`、`lib/react/processScript.js`、`packages/core/src/core/`、`src/observer/`、`src/platform/` | 响应式、组合式 API、构造选项、生命周期、实例方法是否具有共同语义 |
| Style | `lib/style-compiler/`、`lib/platform/style/wx/`、`lib/web/processStyles.js`、`lib/react/processStyles.js` | 单位、选择器、属性、预处理器和运行时样式转换是否通用 |
| JSON | `lib/json-compiler/`、`lib/platform/json/wx/`、`lib/web/processJSON.js`、`lib/react/processJSON.js` | 应用、页面、组件配置哪些是共同结构，哪些会被平台丢弃、转换或限制 |
| 条件编译 | `lib/index.js` 的 defs 注入、`lib/template-compiler/`、`lib/style-compiler/strip-conditional.js`、`lib/style-compiler/plugins/conditional-strip.js`、`lib/utils/mpx-json.js` | 各区块的条件编译入口、语法和产物行为是否一致 |
| Runtime | `packages/core/src/platform/`、`src/platform/patch/`、`src/platform/builtInMixins/`、带 `.web.js` / `.ios.js` 等后缀的文件 | 公共内核与平台 patch 的边界，是否存在平台专属行为 |
| 环境 API | `packages/api-proxy/src/install.js`、`src/platform/index.js`、`src/platform/api/`、`__tests__/web/`、`__tests__/rn/` | 统一调用契约和逐 API 的平台实现是否存在；文件后缀是平台差异的直接证据 |
| 支付宝小程序 | `packages/webpack-plugin/lib/config.js` 的 `ali` 配置、`lib/platform/template/wx/`、`lib/platform/json/wx/`、`packages/core/src/platform/patch/*.ali.js`、`packages/api-proxy/src/platform/api/**/*.ali.js` | 模板方言、事件、生命周期、JSON 字段和环境 API 如何从微信源语法转换到支付宝小程序 |
| 原子 CSS | `packages/unocss-plugin/`、`packages/unocss-base/` 及其测试 | 小程序、Web、RN 的 preset、转换器和支持范围是否真正一致 |
| Skyline | 微信页面 JSON、`packages/size-report/src/SizeReportPlugin.js` 的 `skylineSubpackages` 检查、仓库 Skyline 相关 fixture/文档 | Skyline 是 renderer profile 而非独立 mode；按页面配置、组件和样式约束取证 |

代码审计时不能只搜索 `mode === ...`。还需要检查：

- `.web.js`、`.ios.js`、`.ali.js` 等文件后缀分发；
- `supportedModes`、规则表和组件配置；
- Web/RN 的 `processTemplate/Script/Styles/JSON`；
- `core` 中公共实现与 `platform/patch` 的覆盖关系；
- API 目录是否缺少某个平台实现；
- 编译配置允许用户扩展能力的情况，例如自定义内建组件或自定义 API。

## 能力审计清单

迁移前先创建一份可审阅的能力矩阵，建议保存为 `solutions/mpx-capability-matrix.md`。每条候选结论包含：

| 字段 | 说明 |
| --- | --- |
| `id` | 稳定的能力编号 |
| `dimension` | template、script、style、json、api、build 等 |
| `candidate` | 准备写入 Skill 的原始结论 |
| `source` | 旧 Skill、正式文档或实现中发现的位置 |
| `implementation_evidence` | 关键代码路径与符号，避免只记录不稳定行号 |
| `test_evidence` | 对应测试、fixture、编译命令和结果 |
| `platform_scope` | 已验证的平台或 mode 集合 |
| `classification` | `base`、`ali`、`rn`、`web`、`skyline`、`pending` |
| `reason` | 归类理由和已知限制 |
| `target_reference` | 最终写入的 reference 文件和章节 |

执行约束：

1. 先建立矩阵，再移动正文；不要直接按旧文件标题批量迁移。
2. 每条 `base` 结论至少记录一处编译或运行时实现证据。
3. 涉及支持范围、生命周期、组件属性、样式属性或环境 API 的结论，必须补充测试或多目标编译证据。
4. 无法验证的内容保持 `pending`，不得为了完成目录而写入正式 Skill。
5. 新增平台或实现变化时先更新矩阵，再同步 references，避免 `base` 与平台文档漂移。

## 执行阶段

### 阶段一：确定平台范围与建立基线

1. 从 `packages/webpack-plugin/lib/config.js`、`lib/utils/env.js` 和模板编译器的 mode 校验逻辑记录当前支持的目标集合。
2. 明确支付宝小程序是 `mode=ali`，记录其配置、规则、运行时 patch 和 API 分发入口。
3. 明确 Skyline 是微信 renderer profile，单独记录其验证方式，禁止使用不存在的 `--target=skyline`。
4. 保留旧 `.agents/skills/mpx2rn`，记录版本、文件校验值和现有评测结果。
5. 将 `.agents/skills/mpx2rn-workspace/iteration-8` 的 6 个 eval、63 条断言和 60/63 得分作为 RN 行为基线。
6. 建立能力审计矩阵，逐章节登记旧 RN reference 和现有候选 `base` 内容。

### 阶段二：逐维度审计通用能力

依次审计 SFC、template、script、style、json、条件编译、环境 API 和原子 CSS。每个维度执行相同流程：

1. 从旧 Skill 和正式文档提取候选能力，不直接决定归属。
2. 沿“解析/编译 → 平台转换 → 运行时 → 测试”查找实现证据。
3. 对支付宝小程序检查 `ali` 配置、platform rules、`.ali.js` patch 和 API 实现。
4. 对 Web 检查 `lib/web/process*`，对 RN 检查 `lib/react/process*` 与 RN runtime，对其他小程序检查配置和 platform rules。
5. 涉及 Skyline 时检查微信 JSON 产物、renderer 配置、相关组件和仓库内专项校验；证据不足则保留为 `pending`。
6. 使用最小 fixture 对候选能力执行多目标编译，必要时增加或复用 Jest 测试。
7. 在能力矩阵中给出 `base` 或具体平台归类，并记录理由。

审计完成前不批量重命名 `common` 为 `base`，避免先固定错误边界。

### 阶段三：落地 `base` references

1. 创建 `references/base/guide.md`，明确通用能力定义、目标平台集合、准入规则和按维度读取方式。
2. 将已通过证据审计的能力迁入相应文件。
3. 只描述跨平台不变量；平台限制以链接指向对应平台 reference。
4. 精简与模型已有知识重复的微信公开基础知识；保留解释 Mpx 能力、跨平台一致性和适配边界所必需的最短上下文。
5. 对大于 300 行的 reference 增加目录，并确保每个文件都能从根 Skill 或 `base/guide.md` 到达。

### 阶段四：落地平台差异层

1. RN 首期从旧 `mpx2rn` 迁移，但逐条依据能力矩阵决定保留、拆分或移动到 `base`。
2. `rn/guide.md` 保留 RN 任务路由、高频约束、适配流程和编译校验入口；详细支持矩阵下沉到维度文件。
3. 支付宝小程序、Web 与 Skyline 只写入已完成实现审计的内容，不从 RN 或微信默认行为反向推导。
4. 平台 reference 统一描述：支持状态、与 `base` 的差异、使用约束、适配方案和验证方式。
5. 平台目录仅保留理解差异所需的最短公共上下文，不复制 `base` 完整定义。

### 阶段五：重写根 `SKILL.md`

根文件只承担：

1. 定义 Mpx 基础开发及支付宝小程序、RN、Web、Skyline 跨平台任务的触发范围；
2. 排除纯 RN、纯 Vue/Web 和未使用 Mpx 的小程序任务；
3. 识别任务类型、目标平台和 template/script/style/json/API/build 维度；
4. 路由到 `base` 与目标平台的最小 reference 集；
5. 定义通用开发、适配、排错、Review 和验证流程。

加载示例：

| 任务 | 最小加载集 |
| --- | --- |
| 通用 Mpx 条件编译问题 | 根 `SKILL.md` + `base/conditional-compile.md` |
| 支付宝小程序 JSON 适配 | 根 `SKILL.md` + `base/json.md` + `ali/guide.md` + `ali/json.md` |
| RN 样式适配 | 根 `SKILL.md` + `base/style.md` + `rn/guide.md` + RN 样式相关 reference |
| Web 模板排错 | 根 `SKILL.md` + `base/template.md` + `web/guide.md` + `web/template.md` |
| Skyline JSON 配置 | 根 `SKILL.md` + `base/json.md` + `skyline/guide.md` + `skyline/json.md` |
| RN/Web 差异比较 | 公共维度 reference 只读取一次，再读取 RN/Web 对应差异 |

### 阶段六：迁移脚本与静态检查

1. 迁移 `compile-validate.js` 与内部 loader，保持现有 RN 调用兼容。
2. 根据实际实现确认脚本支持的 `target`，不得把 Skyline 当作独立 mode。
3. 使用 `skill-creator/scripts/quick_validate.py` 检查 frontmatter 和 Skill 结构。
4. 增加相对链接、锚点、孤立文件和重复段落检查。
5. 搜索旧路径和跨 Skill 引用，确保新 Skill 自包含且不依赖 `.agents/skills/mpx2rn`。

### 后续手动阶段

本方案的默认实施范围到阶段六为止。阶段七和阶段八只保留执行说明，不因候选 Skill 创建完成或静态检查通过而自动开始；必须由用户后续分别明确触发。

在手动触发前：

- 不运行候选 Skill 与旧 Skill 的行为评测、benchmark、review viewer 或 description trigger eval；
- 不修改根 `AGENTS.md`、Skill 注册信息或其他活跃入口；
- 不删除、归档或降低旧 `.agents/skills/mpx2rn` 的可用性。

### 阶段七：行为评测（手动触发）

仅在用户明确要求执行行为评测后，按 `skill-creator` 的同轮对比流程运行候选 Skill 与旧 Skill 基线：

1. 复用 iteration-8 的 6 个 RN eval 与 63 条断言。
2. 新增 `base` eval，验证通用任务不会无故加载平台 reference。
3. 新增支付宝小程序、Web、Skyline 和多平台 eval；只对已审计并有证据的能力设置断言。
4. 新增 near-miss 触发测试，例如纯 RN、纯 Vue、未使用 Mpx 的微信项目不应触发。
5. 记录正确率、token、耗时和 reference 读取数量。
6. 生成 benchmark 与 review viewer，人工检查输出后再迭代。
7. 功能稳定后执行 description trigger eval，优化 frontmatter 的触发准确性。

RN 回归最低要求：

- 总分不低于旧 Skill 的 60/63；
- 旧 Skill 已满分的 eval-1、eval-2、eval-3 不回退；
- 同等正确率下，优先选择 reference 读取更少、token 更低的版本。

### 阶段八：仓库切换（手动触发）

阶段七通过后也不自动切换。仅在用户另行明确要求切换仓库入口后执行：

1. 新 Skill 通过评测并经确认后，更新根 `AGENTS.md` 中的触发说明和 Skill 同步路径。
2. 搜索仓库内所有旧 Skill 路径与 reference 链接，逐项更新有效引用。
3. 确认新旧 Skill 不会同时作为活跃入口触发。
4. 旧 `mpx2rn` 的删除或归档单独确认；保留评测快照用于回溯。

## 验证命令

具体实施时根据变更范围执行：

```bash
# Skill 结构
python3 .agents/skills/skill-creator/scripts/quick_validate.py \
  .agents/skills/mpx

# 搜索遗留引用
rg -n "\.agents/skills/mpx2rn|rn-template-reference|rn-script-reference" \
  AGENTS.md .agents solutions

# 编译校验示例，实际 target 以代码确认的 mode 为准
node .agents/skills/mpx/scripts/compile-validate.js \
  path/to/fixture.mpx --target=wx,ali,web,ios --json
```

如果迁移过程中只修改 Markdown 与未变更的脚本副本，不要求执行仓库业务 Jest。若修改编译校验脚本或仓库实现，则必须按根 `AGENTS.md` 运行相关 ESLint 与 Jest；测试失败最多进行两轮修复。

Skyline 通过微信目标构建与 renderer 配置 fixture 验证，不添加不存在的 `skyline` mode。涉及真实宿主行为且仓库测试无法覆盖时，明确记录未验证项，不把静态推断描述为已支持。

## 风险与控制

### `base` 范围过宽

风险：把仅语法相似、实际行为不同的能力描述为通用能力。

控制：执行六项准入条件；平台 patch、后缀文件或 `supportedModes` 出现差异时优先归入平台层。

### `base` 范围过窄

风险：平台目录重复解释相同能力，增加维护和上下文成本。

控制：以源代码公共实现和多目标测试识别真正不变量；平台文档仅保留差异。

### Skyline 被误当作独立编译目标

风险：设计不存在的 mode、错误复用 RN/Web 校验流程。

控制：将 Skyline 视为微信 renderer profile，证据集中在页面 JSON、微信产物和相关专项校验。

### 支付宝差异被误归入 `base`

风险：把微信源语法能够被转换误解为支付宝行为与微信完全一致，遗漏事件、生命周期、JSON 和 API 差异。

控制：对 `mode=ali` 单独检查配置表、platform rules、core patch、API `.ali.js` 实现与目标编译结果。

### 旧 RN 能力迁移回退

风险：拆分公共定义时遗漏 RN 高频约束。

控制：保留旧 Skill，复用 63 条断言，在切换前完成候选与旧版同轮评测。

### 文档结论与代码漂移

风险：实现变化后 `base` 或平台支持矩阵失真。

控制：能力矩阵保留实现符号和测试证据；后续能力变更先更新矩阵，再同步 references。

## 阶段一至六验收标准

- [ ] 候选 `mpx` Skill 已建立且不存在平台 Skill 运行时依赖，旧 `mpx2rn` 活跃入口保持不变。
- [ ] references 使用 `base/ali/rn/web/skyline` 结构。
- [ ] 每条 `base` 能力均有当前仓库实现证据，高风险能力具有测试或编译证据。
- [ ] 平台目录只描述特异性、限制与适配指南，不完整复制 `base`。
- [ ] 未验证结论保持 `pending`，未进入正式 references。
- [ ] Skyline 未被错误建模为独立 `__mpx_mode__`。
- [ ] 支付宝小程序差异具有 `mode=ali` 的实现或测试证据，未混入 `base`。
- [ ] 根 `SKILL.md` 保持精简，并能按平台与维度选择最小 reference 集。
- [ ] Skill 结构、链接、重复内容和遗留引用检查通过。
- [ ] 未自动执行行为评测、修改活跃入口或处理旧 Skill。

## 手动阶段验收标准

- [ ] 阶段七：RN 评测不低于旧 Skill 的 60/63，关键满分用例不回退。
- [ ] 阶段七：已补充 base、支付宝小程序、Web、Skyline、多平台和触发边界 eval。
- [ ] 阶段七：已生成 benchmark 与 review viewer 并完成人工检查。
- [ ] 阶段八：经用户单独确认后完成入口切换，只有一个活跃的 `mpx` Skill。
- [ ] 阶段八：旧 `mpx2rn` 的删除或归档已经单独确认。

## 阶段一至六交付物

1. `.agents/skills/mpx/SKILL.md`；
2. `references/base/` 与 `references/ali/rn/web/skyline/`；
3. `solutions/mpx-capability-matrix.md` 能力证据矩阵；
4. 可复用的编译校验脚本。

## 手动阶段后续交付物

1. 阶段七：eval、评分、benchmark 与 review viewer；
2. 阶段八：新旧 Skill 的迁移映射、回归结果和仓库切换记录。
