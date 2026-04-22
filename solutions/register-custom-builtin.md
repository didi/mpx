# 输出 Web 和 RN 时支持用户注册自定义的内建基础组件

## 需求描述

Mpx 在 Web/RN 输出时将微信侧基础组件映射为框架内建实现（如模版里写 `view`，经跨平台规则变为 `mpx-view` 等）。希望通过 **`webConfig` / `rnConfig` 下的 `customBuiltInComponents`**，让用户用 **自定义模块** **替换** 已有内建实现，并 **扩展** 框架尚未提供默认实现的基础组件能力。

**目标形态（技术方案口径）**：

- **`customBuiltInComponents` 的 key 使用微信小程序侧的原始基础组件标签名**（如 `view`、`text`、`scroll-view`），表示「用户对该基础标签的自定义拓展/替换」；**不再**要求用户直接配置运行时 `mpx-*` 名称。
- **`el.isBuiltIn` 与标签名（tag）的跨平台转换** 统一在现有 **`rulesRunner`** 链路中完成；**将 `customBuiltInComponents` 放在 `getRulesRunner` 的 `data` 上**（**不**经 **`getSpec` / `getComponentConfigs`** 传入）。**`component-config/custom-built-in-component.js`** 注册单条规则，**`test` / `processor` 从 `run-rules` 传入的 `data.customBuiltInComponents` 读取**；顺序紧接 **`fix-component-name`** 之后，**命中后 `run-rules` 即结束**，不再执行后续 `view.js` 等常规转换；**无 `waterfall`**，由自定义实现自行与源平台（微信）语义对齐。
- **value** 仍为自定义实现模块路径（约定见 §2.3）；**插件可对 value 不做格式校验**（以文档与构建期解析为准）。

**说明**：下文 **§1.2 / §3.2** 中「当前已落地」描述的是 **过渡实现**（key 曾为运行时名、合并未经 rulesRunner 扩展）；**§3.3 及以后** 为 **与上述目标对齐** 的修订方向，**不写具体代码**。

## 1. 现状与数据流

### 1.1 编译侧（概念）

- 模版 AST 上各基础组件的规则集中在 **`packages/webpack-plugin/lib/platform/template/wx/component-config/*.js`**，由 **`getRulesRunner`** 汇总，在 **`template-compiler/compiler.js`** 解析过程中对节点执行（**rulesRunner(el)**），完成 **`el.isBuiltIn`**、**`el.tag` 跨平台改名**（如 Web 下 `view` → `mpx-view`）等。
- **`processBuiltInComponents`** 在 **`el.isBuiltIn`** 为真时，用 **当前（已转换后）的 `el.tag`** 作为 key，写入 **`meta.builtInComponentsMap`** → 框架默认资源路径。
- **`web/processTemplate.js`、`react/processTemplate.js`** 将 **`meta.builtInComponentsMap`**（已在 **`processBuiltInComponents`** 中含用户或默认路径）经 **`addQuery`** 写入 **`builtInComponentsMap`**，再经 **`buildComponentsMap`** 生成 **`getComponent(require(...), { __mpxBuiltIn: true })`**。
- **`react/template-loader.js`** 子模版链路须与主模版 **一致**（同样经过带 **rulesRunner** 的 `parse` 与合并逻辑）。

### 1.2 当前实现与目标的差距

| 维度 | 当前已落地（过渡） | 目标方案 |
|------|-------------------|----------|
| **配置 key** | 多为 **运行时标签名**（如 `mpx-view`），与 **`meta.builtInComponentsMap` 的 key** 一致才生效 | **微信原始基础标签名**（如 `view`），与用户模版写法一致 |
| **内建打标与改名** | 依赖既有 **component-config**；**未覆盖** 的标签难以进内建链路 | **`customBuiltInComponents` 作为数据进入 rulesRunner**，在 **跨平台转换** 中与内置规则 **统一** 处理 **`isBuiltIn` + `tag`** |
| **仅配置、无框架默认文件** | 旧方案在 **processTemplate** 二次 merge 时易遗漏 | **`processBuiltInComponents`** 在 **parse** 内直接写入 **用户 path 或默认 path** |

### 1.3 RN 子模版

- 与主链路共用同一套 **parse + rulesRunner 选项**（含 **`customBuiltInComponents` 数据**），保证 **import 模版** 与 **页面/组件模版** 行为一致。

## 2. 配置设计

### 2.1 字段位置与类型

```ts
/** key：微信侧基础组件标签名；value：自定义实现模块路径 */
customBuiltInComponents?: Record<string, string>
```

- **Web**：`webConfig.customBuiltInComponents`
- **RN**：`rnConfig.customBuiltInComponents`（可与 Web 分端配置不同模块）

**与运行时 `mpx.config` 区分**：此处为 **webpack 插件编译期** 配置。

### 2.2 Key 的约定（目标）

- **统一为微信小程序基础组件命名空间下的标签名**（与 **`srcMode` 为 wx 时模版中写的标签** 一致），例如：`view`、`text`、`image`、`scroll-view`；用户 **拓展** 的组件若在微信体系中也按 **基础组件标签** 使用，则同样使用该 **原始 tag 字符串** 作为 key。
- **不负责** 在配置里写 **`mpx-*`**：命中 **`custom-built-in-component`** 时，运行时名统一为 **`mpx-` + 微信 tag**（与常规内置里多数命名一致；**不再**单独区分 RN 的 `mpx-simple-view` 等分支，由自定义实现按需处理）。

### 2.3 Value（文档约定）

| 类型 | 说明 | 示例 |
|------|------|------|
| 绝对路径 | POSIX **`/`** 开头；Windows **`path.isAbsolute` 为真** | `/abs/MyView.vue` |
| npm 模块路径 | **`@scope/pkg/...`** 或 **`my-pkg/...`**（首段为合法包名） | `@acme/ui/MpxView.mpx` |

**不支持**：**`~`** 前缀；**`./`、`../`**（及 `.\`、`..\`）等相对路径。

### 2.4 与 `meta.builtInComponentsMap` / `builtInComponentsMap` 的衔接（目标）

- **`meta.builtInComponentsMap`** 的 key 为 **跨平台转换完成后的 `el.tag`**（如 `mpx-view`），在 **`processBuiltInComponents`** 中一次性写入 **用户 path 或框架默认 path**，**不再**在 `processTemplate` 等处以 **`Object.assign`** 二次合并，也 **不需要** `builtInWxToRuntimeMap`。

## 3. 实现方案（修订方向，不写代码）

### 3.1 核心原则

1. **`customBuiltInComponents` 作为 `data` 注入跨平台层**  
   在 **`getRulesRunner`** 的 **`data`** 对象上挂载 **`customBuiltInComponents`**（与 **`usingComponents`** 并列），由 **`compiler.parse`** 创建 rulesRunner 时 **从 `webConfig` / `rnConfig` 填入**（按 **mode** 取对应端配置）；**`getRulesRunner` 顶层不再单独增加参数**。

2. **在 rulesRunner 规则链路中扩展行为**  
   - 对 **命中 `customBuiltInComponents` 的 wx 标签** 的节点：与 **`component-config`** 中已有基础组件类似地设置 **`el.isBuiltIn`**（若需与原生内置共存，需约定 **仅 Web/RN 输出** 下生效或与现有规则 **合并优先级**：通常 **用户拓展/替换优先** 或 **仅当框架未声明时补充**，具体以产品约定为准，文档建议 **custom 覆盖同名内置的默认实现路径，但不改变平台分支下的 tag 命名规则**）。  
   - **标签名转换** 在 **rulesRunner**（含 **`custom-built-in-component`** 与常规 **`component-config`**）中完成。

3. **`processBuiltInComponents`**  
   在 **`el.isBuiltIn`** 之后按 **`el.tag`** 写入 **`meta.builtInComponentsMap[tag]`**：若 **`el.originalTag`** 在 **`customBuiltInComponents`** 中有配置（由 **`custom-built-in-component`** 规则写入）则用 **用户 path**，否则用 **框架默认 path**；**不支持**以 **`mpx-*`** 为配置 key。

4. **Web app**  
   维持 **不参与** `customBuiltInComponents`（仅固定 **`mpx-keep-alive`**），除非产品明确要求 app 壳也消费该配置。

### 3.2 已实现（processTemplate）

- **`web/processTemplate.js`、`react/processTemplate.js`、`react/template-loader.js`** 仅消费 **`parse` 产出的 `meta.builtInComponentsMap`**（已由 **`processBuiltInComponents`** 写入最终 path），**不再**二次 merge。

### 3.3 待实现清单（与 rulesRunner 相关）

| 项 | 说明 |
|----|------|
| **plugin → compiler** | `parse` 将 **`webConfig.customBuiltInComponents` / `rnConfig.customBuiltInComponents`**（随 **mode**）放入 **`getRulesRunner` 的 `data`**。 |
| **component-config** | **`custom-built-in-component.js`**：单规则、`skipNormalize`；**`test(tag, meta, data)`** 查 **`data.customBuiltInComponents`**；**`processor(el, data)`** 同上；顺序在 **`fix-component-name`** 之下。 |
| **processBuiltInComponents** | 无需改为认 wx tag；保持 **转换后 tag** 为 key。 |
| **processTemplate** | 仅 **`addQuery(meta.builtInComponentsMap)`** 写入 **`builtInComponentsMap`**。 |
| **文档与示例** | 对外文档 **`compile.md` 等** 中示例 key 改为 **`view`/`text`** 等 wx 名，并说明 **经 rulesRunner 转为 `mpx-*`**。 |

### 3.4 自定义实现组件契约

用户模块仍须满足 **`getComponent(..., { __mpxBuiltIn: true })`** 所需导出与行为；**拓展** 组件需与 **微信基础组件能力**（或团队自定义基础能力）在 props/事件上对齐。

## 4. 错误处理

- **value** 可不强制插件校验，由 **webpack** 报错。  
- **wx 标签配置了 custom，但 rulesRunner 未注入或未命中**：应 **开发态可观测**（warning 或构建失败），避免 **静默不注册**。  
- **key 与 `srcMode` 模版标签不一致**（如 ali 下标签名不同）：需在文档中说明 **以当前 `srcMode` 下模版实际标签名为准**，或后续 **增加 srcMode 维度配置**（本方案暂不展开）。

## 5. 测试建议

- **替换**：配置 `view` → 自定义 path，断言 **rulesRunner 后** `el.isBuiltIn` / **运行时 tag** 与 **无 custom 时一致**，且 **require** 指向用户模块。  
- **扩展**：配置框架 **无静态 component-config** 的 wx 基础标签（或团队约定拓展名），断言 **经 rulesRunner** 进入 **meta** 与 **`builtInComponentsMap`**。  
- **RN**：**template-loader** 与 **主模版** 各一条。

## 6. 用户示例（目标配置形态）

```js
const path = require('path')

new MpxWebpackPlugin({
  mode: 'web',
  webConfig: {
    customBuiltInComponents: {
      view: path.resolve(__dirname, 'src/builtin/web/MyView.vue'),
      text: '/abs/path/to/MyText.vue'
    }
  },
  rnConfig: {
    customBuiltInComponents: {
      view: '@your-org/mpx-rn-builtin/MpxView.mpx',
      'scroll-view': '@your-org/mpx-rn-builtin/MpxScrollView.mpx'
    }
  }
})
```

（实际运行时组件名仍为 **`mpx-view`** 等，由 **rulesRunner** 转换，用户 **无需** 在配置里写 `mpx-view`。）

## 7. 风险与后续扩展

- **与现有 `component-config` 重复**：同一 wx 标签 **框架已有** 且 **用户也配置** 时，需约定 **仅替换资源路径** 还是 **整条规则覆盖**；建议 **保留框架 tag 转换规则，仅覆盖默认 module 路径**。  
- **与常规内置 RN 命名差异**：`custom-built-in-component` 路径下 **一律 `mpx-` + 微信 tag**；若业务仍依赖 `mpx-simple-view` 等，勿对该 wx tag 配置 custom，或自行在自定义组件内适配。  
- **`mode` 为小程序原生**：不走 Web/RN 内建合并；**rulesRunner 数据** 是否传入需单独约定（通常 **不生效**）。  
- **srcMode 非 wx**：key 命名是否仍采用「微信基础标签名」需在文档或配置中 **明确**（本方案默认 **仍以 wx 基础组件名为语义锚点**，与 Mpx 主流 **srcMode: wx** 一致）。
