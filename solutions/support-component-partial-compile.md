# partialCompileRules 支持组件局部编译

## 需求描述

当前 `partialCompileRules` 只在页面维度生效：开发环境中可以只编译命中的页面，未命中的页面会被替换为 `runtime/components/wx/default-page.mpx`，从而降低大型小程序的构建耗时。

但命中页面内声明的 `usingComponents` 仍会继续全量编译。对于组件树较深、基础组件库较大的项目，即使只打开一个调试页面，页面依赖的非关键组件也会带来较明显的编译成本。期望 `partialCompileRules` 也能支持组件维度过滤，让开发者只编译当前调试链路真正需要的组件，其余组件输出为空组件兜底。

## 设计目标

- 支持对页面和组件分别配置局部编译规则。
- 保持旧配置兼容：历史形态的 `partialCompileRules: { include, exclude }` 仍只过滤页面，不改变“命中页面会编译其全部组件依赖”的既有行为。
- 未命中的组件不应从 `usingComponents` 中删除，而是替换为可正常构建、可正常被小程序引用的默认组件，避免模板中自定义组件标签失效。
- 页面和组件的 partial compile 行为拉齐：页面通过 `isPage` query 在 resolver 阶段替换默认页面，组件也通过 `isComponent` query 在 resolver 阶段替换默认组件。
- 复用现有页面局部编译和动态组件入口流程，避免引入新的编译入口机制。
- 该能力仍只建议用于开发环境。

## 配置设计

### 兼容旧配置

旧配置保持不变，仍表示“页面局部编译规则”：

```js
partialCompileRules: {
  include: /pages\/order/
}
```

上述配置只过滤页面；被保留页面中的 `usingComponents` 会按当前行为继续编译全部组件。

### 新增分类型配置

新增 `pages` / `components` 分类型规则：

```js
partialCompileRules: {
  pages: {
    include: /pages\/order/
  },
  components: {
    include: [
      /components\/order-card/,
      /components\/price-tag/
    ]
  }
}
```

规则语义与现有 `Rules` 一致：

- `include` 命中且 `exclude` 未命中的资源会正常编译。
- `pages` 省略时，不进行页面过滤。
- `components` 省略时，不进行组件过滤。
- `pages` / `components` 同时省略时，按旧配置处理，顶层 `include` / `exclude` 只作用于页面。

这样既能支持“只过滤页面”的旧用法，也能支持“页面和组件分别过滤”或“只过滤组件”的新用法。

## 当前实现梳理

### 页面局部编译

页面过滤发生在 `packages/webpack-plugin/lib/index.js` 的 resolver 拦截逻辑中：

1. 识别带 `?isPage` 且非 block 类型的页面请求。
2. 如果页面资源路径未命中 `partialCompileRules`，将请求路径替换为 `runtime/components/wx/default-page.mpx`。
3. 在 query 上追加 `resourcePath=原页面路径`，让后续 `parseRequest` 仍把该模块记录为原页面资源。
4. `json-compiler` 在处理 app.json 的 pages 时遇到默认页面，会把它放入兜底页面缓存，保证最终 app.json 至少有可用页面。

### 组件编译入口

组件不是通过 resolver 层统一带 `?isComponent` 进入的。普通组件来自 json 中的 `usingComponents`：

1. `packages/webpack-plugin/lib/json-compiler/index.js` 遍历 `json.usingComponents`。
2. 调用 `json-compiler/helper.js` 里的 `processComponent` 解析组件路径。
3. `processComponent` 生成 `DynamicEntryDependency`，entryType 为 `component`。
4. `DynamicEntryDependency` 通过 `mpx.getPackageInfo` / `recordResourceMap` 记录组件输出路径，并调用 `mpx.addEntry` 添加组件入口。

其中 `loader.js` / `native-loader.js` 已经支持通过 `isPage` / `isComponent` query 将单独编译资源识别为页面或组件；web / react 侧的 `processJSON.js` 也会在记录本地组件映射时给组件资源补 `isComponent`。为了和页面 partial compile 行为对齐，组件局部编译应当在 `processComponent` resolve 前补齐 `isComponent` query，并复用 resolver 拦截逻辑完成默认组件替换。

## 实现方案

### 1. 抽取 partialCompileRules 归一化工具

新增工具方法，例如 `packages/webpack-plugin/lib/utils/partial-compile-rules.js`：

```js
const { matchCondition } = require('./match-condition')

const hasTypedRules = rules => {
  return !!(rules && (rules.pages || rules.page || rules.components || rules.component))
}

const getPartialCompileRules = (rules, type) => {
  if (!rules) return null

  if (type === 'page') {
    return rules.pages || rules.page || (hasTypedRules(rules) ? null : rules)
  }

  if (type === 'component') {
    return rules.components || rules.component || null
  }

  return null
}

const matchPartialCompileRules = (resourcePath, rules, type) => {
  const targetRules = getPartialCompileRules(rules, type)
  return !targetRules || matchCondition(resourcePath, targetRules)
}

module.exports = {
  getPartialCompileRules,
  matchPartialCompileRules
}
```

说明：

- `page` / `component` 单复数都兼容，文档主推 `pages` / `components`。
- 旧配置无分类型字段时，顶层规则只作为页面规则。
- `matchPartialCompileRules` 对未配置对应类型规则的资源返回 `true`，表示不启用该类型过滤。

### 2. 调整 resolver 拦截，统一处理页面和组件

在 `packages/webpack-plugin/lib/index.js` 中获取页面和组件规则：

```js
const { getPartialCompileRules } = require('./utils/partial-compile-rules')
```

现有逻辑从：

```js
if (isResolvingPage(obj) && !matchCondition(obj.path, this.options.partialCompileRules)) {
  // 替换 default-page
}
```

调整为同时取出页面和组件规则：

```js
const pagePartialCompileRules = getPartialCompileRules(this.options.partialCompileRules, 'page')
const componentPartialCompileRules = getPartialCompileRules(this.options.partialCompileRules, 'component')

if (pagePartialCompileRules || componentPartialCompileRules) {
  // 注册 resolver 拦截
}
```

新增组件识别方法，与页面识别方式保持一致：

```js
function isResolvingComponent (obj) {
  const query = parseQuery(obj.query || '?')
  return query.isComponent && !query.type
}
```

拦截内部按资源类型分别匹配规则并替换默认资源，未配置对应类型规则时直接跳过该类型：

```js
if (pagePartialCompileRules && isResolvingPage(obj) && !matchCondition(obj.path, pagePartialCompileRules)) {
  // 替换 default-page
}

if (componentPartialCompileRules && isResolvingComponent(obj) && !matchCondition(obj.path, componentPartialCompileRules)) {
  // 替换 default-component
}
```

这样当用户只配置 `components` 时，不会因为存在 `partialCompileRules` 而把所有页面都替换成默认页面。

替换组件时沿用页面的 query 处理方式：保留原请求 query，在 query 上追加 `resourcePath=原组件路径`，再将 `obj.path` 改为 `runtime/components/wx/default-component.mpx`。后续 `parseRequest(resource).resourcePath` 仍得到原组件路径，组件输出路径和 `componentsMap` 记录也会保持为原组件。

### 3. 新增默认组件

新增 `packages/webpack-plugin/lib/runtime/components/wx/default-component.mpx`，作为未命中组件的兜底实现：

```html
<template>
  <view></view>
</template>

<script>
import { createComponent } from '@mpxjs/core'

createComponent({})
</script>
```

默认组件需要满足：

- 可被所有未命中组件复用。
- 不引入业务依赖。
- 不暴露 props / events 语义，开发环境仅提供占位能力。
- 输出路径仍使用原组件的输出路径，避免页面 json 中的引用路径变化。

### 4. 在 processComponent 中补齐 isComponent query

在 `packages/webpack-plugin/lib/json-compiler/helper.js` 的 `processComponent` 中，参照 `processPage` 的处理方式，在 resolve 前给组件请求添加 `isComponent` 标记：

```js
component = addQuery(component, { isComponent: true })
```

处理流程调整为：

1. `processComponent` 在调用 `resolve` 前补齐 `isComponent`。
2. resolver 根据 `isComponent` 和 `partialCompileRules.components` 判断是否命中组件局部编译规则。
3. 命中时保持真实组件资源不变。
4. 未命中时在 resolver 阶段将资源替换为默认组件，并追加 `resourcePath=原组件路径`。
5. `processComponent` resolve 完成后继续执行现有逻辑：处理 `root` query / `asyncSubpackageRules`，计算 `outputPath`，生成 `getDynamicEntry(resource, 'component', outputPath, tarRoot, relativePath, '', extraOptions)`。

关键点是默认组件请求必须携带 `resourcePath=原组件路径`。这样：

- `parseRequest(resource).resourcePath` 仍是原组件路径。
- `componentsMap[packageName][原组件路径]` 会记录到原组件输出路径。
- 多个未命中组件不会因为都使用同一个 `default-component.mpx` 真实文件而产生资源映射冲突。
- `?resolve` 对已进入构建图的未命中组件仍能拿到稳定的组件输出路径。

这样组件和页面的处理链路保持一致：

| 类型 | 打标位置 | resolver 识别 | 未命中替换 |
|------|----------|---------------|------------|
| 页面 | `processPage` resolve 前添加 `isPage` | `isResolvingPage` | `default-page.mpx?resourcePath=原页面路径` |
| 组件 | `processComponent` resolve 前添加 `isComponent` | `isResolvingComponent` | `default-component.mpx?resourcePath=原组件路径` |

### 5. 保持 usingComponents 结构不删除

不采用 `RESOLVE_IGNORED_ERR` 删除 `usingComponents` 的方案。

原因：

- 页面模板中仍可能存在该组件标签，删除 json 声明会导致运行时或平台编译行为不可控。
- 当前模板编译依赖 `usingComponentsInfo` 判断自定义组件，删除后会影响组件节点识别。
- 默认组件替换可以最大程度保持页面 json 和模板结构稳定，仅跳过真实组件源码编译。

### 6. 调整 ResolveDependency 的错误抑制

`packages/webpack-plugin/lib/dependencies/ResolveDependency.js` 当前在 `?resolve` 找不到页面 / 组件 / 静态资源时，会在存在 `partialCompileRules` 且资源未命中规则时静默返回空字符串。

分类型规则下可调整为：

```js
const pageRules = getPartialCompileRules(partialCompileRules, 'page')
const componentRules = getPartialCompileRules(partialCompileRules, 'component')

const ignoredByPartialCompile =
  (pageRules && !matchCondition(resourcePath, pageRules)) ||
  (componentRules && !matchCondition(resourcePath, componentRules))
```

当 `ignoredByPartialCompile` 为真时沿用当前静默逻辑；否则继续抛出原有错误。

说明：

- 对旧页面规则，行为与当前基本一致。
- 对组件规则，未命中组件若没有进入构建图，`?resolve` 返回空且不报错；已进入构建图的未命中组件会因为默认组件入口记录了原资源映射而正常返回输出路径。

## 数据流示例

配置：

```js
partialCompileRules: {
  pages: {
    include: /pages\/demo/
  },
  components: {
    include: /components\/keep/
  }
}
```

页面 `pages/demo/index.mpx` 引用：

```json
{
  "usingComponents": {
    "keep-card": "../../components/keep/card.mpx",
    "heavy-list": "../../components/heavy/list.mpx"
  }
}
```

构建结果：

- `pages/demo/index.mpx` 命中页面规则，正常编译。
- `components/keep/card.mpx` 命中组件规则，正常编译。
- `components/heavy/list.mpx` 未命中组件规则，resolver 将请求替换为 `default-component.mpx?resourcePath=components/heavy/list.mpx`，后续动态入口仍按原组件输出路径记录。
- 页面输出 json 中仍保留 `heavy-list`，其路径指向原组件应有的输出路径，但该路径对应的产物内容来自默认组件。

## 测试方案

只需要补充与本次变更相关的核心用例。

### 1. 旧配置兼容

配置：

```js
partialCompileRules: {
  include: /pages\/demo/
}
```

断言：

- 未命中页面仍替换为默认页面。
- 命中页面内的所有 `usingComponents` 仍按旧行为真实编译。

### 2. 页面 + 组件分类型过滤

配置：

```js
partialCompileRules: {
  pages: {
    include: /pages\/demo/
  },
  components: {
    include: /components\/keep/
  }
}
```

断言：

- 命中页面正常输出。
- 命中组件输出真实组件内容。
- 未命中组件输出默认组件内容。
- 页面 json 的 `usingComponents` 不缺失未命中组件声明。

### 3. 只过滤组件

配置：

```js
partialCompileRules: {
  components: {
    include: /components\/keep/
  }
}
```

断言：

- 页面不被 partialCompileRules 过滤。
- 组件按 `components` 规则过滤。

### 4. 分包组件

断言：

- 分包页面引用的未命中组件仍输出到正确分包路径。
- 主包已引用过的组件仍复用现有 `getPackageInfo` 规则，不引入新的主包 / 分包判定。

### 5. resolve 行为

断言：

- 对已进入构建图的未命中组件使用 `?resolve` 能返回组件输出路径。
- 对未进入构建图且未命中组件规则的资源使用 `?resolve` 不报错，返回空字符串。
- 对命中规则但不存在映射的资源仍按现有逻辑报错。

## 风险与边界

- 该能力面向开发环境。未命中组件被替换为空组件后，页面交互和布局可能与真实场景不同，属于预期行为。
- 默认组件不模拟 props、事件、slot 和 externalClasses，仅保证引用链路可构建。
- 异步分包组件仍沿用现有 `asyncSubpackageRules` / `componentPlaceholder` 规则；如果原来需要 placeholder，局部编译后仍需要满足该配置。
- 旧配置不启用组件过滤，避免历史项目升级后突然把页面依赖组件替换为空组件。

## 实施步骤

1. 新增 `utils/partial-compile-rules.js`，集中处理规则归一化。
2. 调整 `index.js` resolver 拦截逻辑，基于 `isPage` / `isComponent` 分别处理页面和组件替换。
3. 新增 `runtime/components/wx/default-component.mpx`。
4. 调整 `json-compiler/helper.js` 的 `processComponent`，在 resolve 前为组件请求补齐 `isComponent` query。
5. 调整 `ResolveDependency.js` 的 partial compile 错误抑制逻辑。
6. 补充局部测试用例，覆盖旧配置兼容、组件过滤、只过滤组件和分包组件。
