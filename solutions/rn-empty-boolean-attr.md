# Mpx2RN 无值属性布尔语义抹平方案

## 背景

微信小程序模板中，只传递属性名而不传递属性值时，语义等价于传递 `true`：

```html
<scroll-view scroll-y />
<scroll-view scroll-y="{{true}}" />
```

两者在微信中等价。但当前输出 RN 时，无值属性会在模板解析阶段进入 AST：

```js
{ name: 'scroll-y', value: undefined }
```

随后 RN render code 生成时会输出：

```js
createElement(getComponent("mpx-scroll-view"), { "scroll-y": undefined })
```

这会导致 `scroll-y`、`refresher-enabled`、`user-select`、`disabled`、`checked` 等布尔属性在 RN 侧没有获得微信语义里的 `true`。

## 目标

- RN 输出中抹平微信无值属性语义：普通属性 `value === undefined` 时按 `true` 传递。
- 显式传值行为保持不变：
  - `scroll-y="{{true}}"` 仍输出表达式 true。
  - `scroll-y="{{false}}"` 仍输出表达式 false。
  - `scroll-y=""` 仍保留空字符串，不被误判为 true。
  - `scroll-y="false"` 仍保留字符串 `"false"`。
- 覆盖 RN 内置基础组件、普通自定义组件、`rnConfig.customBuiltInComponents` 扩展基础组件。
- 不改变小程序与 Web 产物，避免影响现有序列化逻辑。

## 非目标

- 不调整微信、支付宝、百度、Web 等非 RN 平台的无值属性输出。
- 不为具体组件逐个维护布尔属性白名单。
- 不改变运行时组件默认值，只修正模板编译传参语义。
- 不把无值事件绑定、无值模板指令当作本次能力目标；这类写法本身缺少有效 handler 或表达式，应保持现有诊断与行为。

## 现状链路

相关链路如下：

```text
parseHTML
  -> handleStartTag
    -> attrs[i] = { name, value: decode(value) }
      无值属性 value 为 undefined
  -> createASTElement
  -> processElement
    -> rulesRunner(el)
    -> processDuplicateAttrsList(el)
    -> RN 分支 processIf/processFor/processRefReact/processStyleReact/processEventReact...
    -> processAttrs(el, options)
  -> gen-node-react
    -> JSON.stringify(value)
```

关键文件：

- `packages/webpack-plugin/lib/template-compiler/compiler.js`
- `packages/webpack-plugin/lib/template-compiler/gen-node-react.js`
- `packages/webpack-plugin/lib/platform/template/normalize-component-rules.js`
- `packages/webpack-plugin/lib/platform/template/wx/component-config/*`

当前问题不是 `scroll-view` 单组件配置缺失，而是 RN render code 生成前没有把微信无值属性语义规范化。

## 方案选择

### 方案 A：解析器阶段把无值属性改为 true

在 `parseHTML` / `handleStartTag` 中直接将未匹配到值的属性写成 `true`。

优点：

- 最早建立统一语义。

缺点：

- 会影响所有平台。
- 非 RN 序列化逻辑当前依赖 `value == null` 输出无值属性；若改成 boolean true，`serialize` 会尝试输出 `=undefined`，风险较大。

结论：不采用。

### 方案 B：只在 `gen-node-react` 兜底 undefined 为 true

在 RN codegen 生成 props 时，把 `value === undefined` 转成 `true`。

优点：

- 改动很小。
- 不影响非 RN 平台。

缺点：

- 语义修正发生得太晚，前面的 RN 模板处理逻辑仍看到 `undefined`。
- 难以区分普通属性、事件属性、残留指令。
- 对后续依赖 `attrsMap` 的处理没有帮助。

结论：可作为兜底思路，但不是首选。

### 方案 C：RN 属性处理阶段规范化普通无值属性

在 `compiler.js` 的 RN 属性处理阶段统一处理剩余普通属性。当前 `processAttrs` 已经包含 RN 专属的属性值预处理逻辑（如纯插值表达式前后空格修正），因此该逻辑可以收敛在 `processAttrs` 内部，通过小 helper 保持职责清晰：

```text
RN processElement
  -> processIf / processFor
  -> processRefReact
  -> processStyleReact
  -> processEventReact
  -> processSlotReact
  -> processAttrs
    -> processReactNoValueAttr
    -> parseMustacheWithContext
```

推荐采用该方案。

## 推荐设计

直接复用 `processAttrs` 中已有的 `isReact(mode)` 分支处理。该分支当前已经负责 RN 属性值预处理，可在纯插值表达式 trim 逻辑之前先处理无值普通属性：

```js
function processAttrs (el, options) {
  el.attrsList.forEach((attr) => {
    const isTemplateData = el.tag === 'template' && attr.name === 'data'
    const needWrap = isTemplateData && mode !== 'swan'
    let value = needWrap ? `{${attr.value}}` : attr.value

    if (isReact(mode)) {
      // existing RN trim logic for pure mustache expressions
      if (value === undefined) {
        value = '{{true}}'
        modifyAttr(el, attr.name, value)
      }
    }

    // existing parseMustacheWithContext logic
  })
}
```

实际实现时无值属性应改写为 `{{true}}` 字符串，而不是直接把 `attr.value` 设为布尔值。这样可继续复用 `parseMustacheWithContext` / `addExp` 的表达式链路，保证最终 RN render code 向子组件传递的是布尔值 `true`，同时维持 AST 属性值均为字符串的约定。

### 为什么放在 `processAttrs` 中

- 只影响 RN 输出，不改变非 RN 平台。
- 当前 `processAttrs` 已经存在 `isReact(mode)` 分支逻辑，直接在该分支内做 RN 属性值归一化，改动最集中。
- 能覆盖 `rnConfig.customBuiltInComponents`。这类组件命中 `custom-built-in-component.js` 后会 `skipNormalize`，不会走 `normalizeComponentRules` 的 `preProps/postProps`，因此如果只在平台规则里处理会漏掉。
- `processAttrs` 在 RN 分支中位于事件、slot、ref、样式等处理之后，特殊属性已由前置流程处理，剩余 `value === undefined` 的属性可统一按微信无值属性语义转为 `true`。
- 在 `parseMustacheWithContext` 前规范化，后续表达式依赖收集与 `gen-node-react` 会自然看到 `true`。
- 同步更新 `attrsList` 与 `attrsMap`，避免两份结构不一致。

## 行为示例

```html
<scroll-view scroll-y />
```

RN 输出应从：

```js
createElement(getComponent("mpx-scroll-view"), { "scroll-y": undefined })
```

变为：

```js
createElement(getComponent("mpx-scroll-view"), { "scroll-y": true })
```

以下写法保持原行为：

```html
<scroll-view scroll-y="{{false}}" />
<scroll-view scroll-y="" />
<scroll-view scroll-y="false" />
```

`is-simple` 这类 RN 编译标记仍由组件配置消费，不应作为 prop 透出：

```html
<view is-simple />
```

仍应输出简单组件：

```js
createElement(getComponent("mpx-simple-view"), ...)
```

## 测试建议

新增或补充 `packages/webpack-plugin/test/template-compiler/rn-template.spec.js`：

1. `scroll-view` 无值布尔属性：
   - 输入：`<scroll-view scroll-y />`
   - 期望：输出包含 `"scroll-y": true`
2. 显式布尔表达式不受影响：
   - 输入：`<scroll-view scroll-y="{{false}}" />`
   - 期望：输出包含 `"scroll-y": (false)`
3. 空字符串不被误判：
   - 输入：`<view id="" />`
   - 期望：输出包含 `id: ""`
4. RN 编译标记仍被消费：
   - 输入：`<view is-simple />`
   - 期望：输出使用 `mpx-simple-view`，且不包含 `"is-simple": true`
5. `customBuiltInComponents` 覆盖：
   - 配置 `rnConfig.customBuiltInComponents.audio`
   - 输入：`<audio controls />`
   - 期望：输出组件为 `mpx-audio`，且包含 `controls: true`

相关单测即可，无需全量测试。

## 文档与 Skill 同步

该变更会改变 RN 输出对用户模板写法的支持范围，属于对外开发使用方式抹平。代码实现时应同步更新：

- `docs-vitepress/` 中 RN 模板能力或跨端差异相关文档，说明 RN 输出支持微信无值属性等价 true 的写法。
- `.agents/skills/mpx2rn/references/rn-template-reference.md`，建议在“模板语法”或“基础组件通用属性”附近补充说明：
  - RN 输出已支持 `<component boolean-prop>` 等价于 `<component boolean-prop="{{true}}">`。
  - 仅针对普通属性；事件与指令仍应显式传入合法 handler 或表达式。

## 风险与注意点

- 必须使用 `value === undefined` 精确判断，不能用 `!value`，否则会误伤空字符串、`0`、`false`。
- 不建议维护布尔属性白名单或额外属性名判断。微信语义是无值属性整体按 true 处理，且 RN 自定义基础组件也可能有业务自定义布尔属性。
- 不建议放在 `platform/template/wx/index.js` 的 `preProps` 中作为唯一方案，因为 `customBuiltInComponents` 的 `skipNormalize` 会绕过该链路。
- 若后续发现 `gen-node-react` 仍存在直接消费未规范化 AST 的入口，可再增加 codegen 层兜底，但首选先保证主编译链路语义正确。
