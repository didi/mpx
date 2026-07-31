# Mpx2RN 支持 createSelectorQuery 查询组件节点方案

## 背景

Mpx2RN 当前已经支持在基础组件节点上通过 `wx:ref` 建立 selector 映射，再使用 `createSelectorQuery().select(selector)` 获取布局、dataset、属性、样式等信息。但当 selector 命中的是自定义组件节点时，现有实现只能拿到组件实例，无法继续落到该组件对应的 RN 原生视图节点，因此下面这类小程序常见写法在 RN 侧无法按预期工作：

```xml
<template>
  <card id="card" wx:ref />
</template>
<script>
  import { createPage } from '@mpxjs/core'

  createPage({
    ready () {
      this.createSelectorQuery()
        .select('#card')
        .boundingClientRect()
        .exec(([rect]) => {
          console.log(rect)
        })
    }
  })
</script>
```

现状链路中，`compiler.js` 的 `processRefReact()` 会按节点类型把 selector 注册为 `node` 或 `component`；`SelectorQuery.select()` 只读取 `node` 类型，所以组件 selector 即使已经写了空 `wx:ref`，也不会被 `createSelectorQuery` 测量到。

## 目标

1. RN 侧 `createSelectorQuery().select()` / `selectAll()` 在 selector 命中自定义组件节点时，可以返回该组件 host 节点的布局与节点信息。
2. 保持 `selectComponent()` / `selectAllComponents()` 继续返回组件实例，不改变现有组件实例选择语义。
3. 复用 RN 现有 `wx:ref` selector 映射机制，仍要求业务模板在目标组件节点声明空 `wx:ref`。
4. 不额外包裹组件，不改变 DOM/RN 视图层级，不影响 virtualHost 的既有语义。
5. 改动限定在 Mpx2RN 编译与 RN selector 运行时，不影响小程序、Web 输出。

## 非目标

1. 不扩展 RN selector 支持范围，仍只支持 `#id`、`.class` 以及连续 class 交集，例如 `.a.b`。
2. 不支持后代、兄弟、逗号等复杂选择器。
3. 不让 virtualHost 组件凭空拥有实体 host 节点；virtualHost 场景保持不可按组件节点测量，或后续另设显式降级策略。
4. 不把 `__mpxHost` 暴露为用户推荐 API，它只是内部 host ref 名称。

## 当前实现梳理

### 编译期

相关文件：

- `packages/webpack-plugin/lib/template-compiler/compiler.js`
- `packages/webpack-plugin/lib/template-compiler/gen-node-react.js`
- `packages/webpack-plugin/lib/react/processTemplate.js`

RN 模板编译中，`processRefReact(el, meta)` 会消费 `wx:ref`：

1. `el.isBuiltIn ? 'node' : 'component'` 决定 ref 类型。
2. 空 `wx:ref` 不注册 `$refs` 名称，但会把节点上的 `id`、`class`、`wx:class` 编进 selector 映射。
3. 最终给 React 节点添加 `ref="{{ this.__getRefVal(type, selectorsConf, refFnId) }}"`。
4. `meta.refs` 会通过 `processTemplate.js` 注入为 `currentInject.getRefsData`，供运行时初始化 `$refs`。

RN 非 virtualHost 组件已经会在 `getVirtualHostRoot()` 中自动生成实体 host 根节点：

```js
const rootView = createASTElement(tagName, [
  { name: 'class', value: `${MPX_ROOT_VIEW} host-${moduleId}` },
  { name: 'ishost', value: '{{true}}' }
])
```

运行时 `getDefaultOptions.ios.js` 会识别 `root.props.ishost`，把父组件传入但未声明为 props 的 `class`、`style`、事件、dataset 等属性继承到该 host 节点。

### 运行时

相关文件：

- `packages/core/src/platform/builtInMixins/refsMixin.ios.js`
- `packages/core/src/platform/patch/getDefaultOptions.ios.js`
- `packages/api-proxy/src/platform/api/create-selector-query/rnSelectQuery.js`
- `packages/api-proxy/src/platform/api/create-selector-query/rnNodesRef.js`

`refsMixin.ios.js` 当前维护两类映射：

```js
this.__refs[selectorKey] = [
  { type: 'node', instance: nodeHandlerRef },
  { type: 'component', instance: componentInstance }
]
```

`selectComponent(selector)` 调用 `__selectRef(selector, 'component')`，返回组件实例。

`createSelectorQuery().select(selector)` 调用 `__selectRef(selector, 'node')`，返回基础组件的 `HandlerRef`，再由 `NodeRef` 调用 `getNodeInstance()` 获取 `nodeRef`、`props`、`instance`，完成 `boundingClientRect()`、`fields()`、`node()`、`ref()` 等后续操作。

缺口在于：组件 selector 对应的 `componentInstance` 没有被转换为组件 host 节点的 `HandlerRef`。

## 总体方案

采用两段式方案：

1. **编译期自动给组件实体 host 根节点添加内部 ref**：在 RN 非 virtualHost 组件自动生成的 host 节点上添加 `wx:ref="__mpxHost"`，让组件实例内部可以稳定拿到自己的 host 原生节点。
2. **运行时复用 `__selectRef` 增加全类型查询能力**：`createSelectorQuery.select()` 调用 `__selectRef(selector, 'all', all)` 获取所有 selector 命中的 ref 实例，跳过 `node` / `component` 类型过滤；如果命中组件实例，则从组件实例内部的 `__mpxHost` ref 解析出 host `HandlerRef`，再交给现有 `NodeRef` 后续流程。

示意链路：

```text
父模板 <card id="card" wx:ref />
  |
  | processRefReact: #card -> { type: component, instance: cardInstance }
  v
父实例.__refs['#card']
  |
  | createSelectorQuery().select('#card')
  v
__selectRef('#card', 'all')
  |
  | componentInstance.__selectRef('__mpxHost', 'node')
  v
card 组件自动 host 节点 HandlerRef
  |
  | NodeRef.boundingClientRect / fields / node / ref
  v
RN 原生视图测量结果
```

## 详细设计

### 1. 编译期注入 host ref

修改 `packages/webpack-plugin/lib/template-compiler/compiler.js`。

建议新增内部常量：

```js
const MPX_HOST_REF = '__mpxHost'
```

在 `getVirtualHostRoot()` 的 RN 非 virtualHost 组件分支中，为自动生成的 host 节点追加 ref 指令：

```js
const rootView = createASTElement(tagName, [
  {
    name: 'class',
    value: `${MPX_ROOT_VIEW} host-${moduleId}`
  },
  {
    name: 'ishost',
    value: '{{true}}'
  },
  {
    name: config[mode].directive.ref,
    value: MPX_HOST_REF
  }
])
```

该 host 节点后续会走已有 `processElement(rootView, rootView, options, meta)`，因此 `processRefReact()` 会自动完成：

1. 把 `__mpxHost` 记录到当前组件的 `meta.refs`。
2. 给 host 节点添加 React `ref` 回调。
3. 将 host 注册到当前组件实例的 `__refs.__mpxHost` 中，类型为 `node`。

无需新增额外视图节点，也无需修改 `gen-node-react.js` 的通用代码生成逻辑。

### 2. 扩展 `__selectRef` 支持全类型查询

修改 `packages/core/src/platform/builtInMixins/refsMixin.ios.js`。

复用现有 `__selectRef(selector, refType, all)`。当 `refType === 'all'` 时，跳过 `type === refType` 判断，把 selector 命中的所有 ref 实例都推入结果；其他调用保持现状。

核心逻辑：

```js
__selectRef (selector, refType, all = false) {
  const splitedSelector = selector.match(/(#|\.)?[^.#]+/g) || []
  const refsArr = splitedSelector.map(selector => {
    const refs = this.__refs[selector] || []
    const res = []
    refs.forEach(({ type, instance }) => {
      if (refType === 'all' || type === refType) {
        res.push(instance)
      }
    })
    return res
  })

  const refs = refsArr.reduce((preRefs, curRefs, curIndex) => {
    if (curIndex === 0) return curRefs
    curRefs = new Set(curRefs)
    return preRefs.filter(p => curRefs.has(p))
  }, [])

  return all ? refs : refs[0]
}
```

设计点：

1. `selectComponent()` / `selectAllComponents()` 仍传 `refType = 'component'`，行为不变。
2. 已有基础节点查询兜底仍可传 `refType = 'node'`，行为不变。
3. `createSelectorQuery.select()` 显式传 `refType = 'all'`，拿到基础节点 `HandlerRef` 与组件实例的混合结果。
4. `all` 模式建议仍推入 `instance`，不要推入新建 `{ type, instance }` 包装对象；现有 `.a.b` 连续 class selector 依赖 `Set` 按同一个 `instance` 做交集，包装对象会破坏交集命中。
5. 以第一个 selector token 的注册顺序为基准，继续保持 `select()` / `selectAll()` 的结果顺序与当前 `__refs` 注册顺序一致。

### 3. createSelectorQuery 接入 all 模式

修改 `packages/api-proxy/src/platform/api/create-selector-query/rnSelectQuery.js`。

当前：

```js
const refs = this._component && this._component.__selectRef(selector, 'node', all)
return new NodeRef(refs, this, !all)
```

调整为调用 `__selectRef(selector, 'all', all)`，再把混合结果归一化为 `NodeRef` 可消费的基础节点 `HandlerRef`：

```js
const HOST_REF = '__mpxHost'

function normalizeNodeRef (ref) {
  if (!ref) return ref
  if (ref.getNodeInstance) return ref
  if (ref.__selectRef) return ref.__selectRef(HOST_REF, 'node')
}

let refs = this._component && this._component.__selectRef(selector, 'all', all)
if (Array.isArray(refs)) {
  refs = refs.map(normalizeNodeRef).filter(Boolean)
} else {
  refs = normalizeNodeRef(refs)
}
return new NodeRef(refs, this, !all)
```

这样 `createSelectorQuery().select()` 和 `selectAll()` 仍只向 `NodeRef` 传入基础节点 `HandlerRef`。组件实例解到 host 的逻辑集中在 query 层，`__selectRef` 仍是通用 selector 匹配能力，不掺入测量语义。

说明：

1. `ref.getNodeInstance` 用于判断基础节点 `HandlerRef`。
2. `ref.__selectRef` 用于判断组件实例，并读取其内部 `__mpxHost` 节点；这与 `instance.$refs.__mpxHost` 语义一致，但实现侧直接调用 `__selectRef(HOST_REF, 'node')` 可以避免 `$refs` getter 再包装成 `NodeRef`。
3. host 不存在时过滤该项，最终单选返回 `undefined`，`NodeRef` 会按现有逻辑返回 `null`；多选返回空数组。

### 4. NodeRef 无需改动

`rnNodesRef.js` 当前接收的是 `HandlerRef` 或 `HandlerRef[]`，并通过 `getNodeInstance()` 读取：

- `nodeRef.current.measure()`：用于 `boundingClientRect()` / `fields({ rect, size })`
- `props.current`：用于 `id`、dataset、properties
- `instance.style`：用于 computedStyle
- `instance.node` / `instance.context` / `instance.ref`：用于对应字段

组件 host 最终解析出的仍是基础组件 host 节点的 `HandlerRef`，与普通基础节点完全同构，所以不需要调整 `NodeRef`。

## 边界与兼容性

### virtualHost 组件

`autoVirtualHostRules` 命中的组件没有实体 host 节点，本方案不为其补节点，也不默认降级到第一个根节点。

原因：

1. virtualHost 的语义就是组件不生成额外实体 host。
2. 降级到第一个根节点在多根、条件渲染、动态根节点场景下语义不稳定。
3. 自动补实体节点会改变布局和样式继承，风险高于收益。

因此 virtualHost 组件被 `createSelectorQuery.select()` 命中时，如果组件内部没有 `__mpxHost`，结果保持 `null` / `[]`。若后续确实需要支持，可以另设能力：要求 virtualHost 组件单根，并在编译期把外部 selector 映射透传到该单根节点，但这属于单独方案。

### customTextRules

非 virtualHost 且命中 `customTextRules` 的组件会生成 `text` host。该节点同样会被注入 `wx:ref="__mpxHost"`，测量与字段读取走基础 `text` 组件现有能力。

### 异步组件与 placeholder

异步组件真实实例未挂载前，父级 selector 可能只命中 placeholder 或无法解析到真实 host。方案不额外等待异步组件完成，保持现有时序：业务应在组件 ready 或下一轮更新后查询。`NodeRef` 对未挂载节点已有 `null` / 空数组语义。

### selector 顺序

当前 RN selector 映射依赖 React ref 回调维护 `__refs` 数组，顺序本身就是近似模板顺序的运行时顺序。本方案继续沿用该顺序，不引入额外排序。

### 同名内部 ref 冲突

`__mpxHost` 作为内部保留 ref 名称使用。用户不应在业务模板中手写 `wx:ref="__mpxHost"`；后续实现时可在文档中标注为内部名称，或在编译警告中提示该名称保留。

## 示例

### 输入

```xml
<!-- page.mpx -->
<template>
  <card id="profileCard" class="card active" wx:ref />
</template>
```

### 关键编译结果

父级模板中：

```text
#profileCard / .card / .active -> { type: 'component', instance: cardInstance }
```

`card.mpx` 自动 host 中：

```xml
<view class="mpx-root-view host-xxx" ishost="{{true}}" wx:ref="__mpxHost">
  ...
</view>
```

子组件实例中：

```text
__mpxHost -> { type: 'node', instance: hostNodeHandlerRef }
```

查询时：

```js
this.createSelectorQuery()
  .select('#profileCard')
  .fields({
    id: true,
    dataset: true,
    rect: true,
    size: true
  })
  .exec(([res]) => {
    // res 来自 card 的 host 节点
  })
```

## 修改文件清单

预计涉及：

1. `packages/webpack-plugin/lib/template-compiler/compiler.js`
   - 增加 host ref 内部常量。
   - 在 RN 非 virtualHost 组件自动 host 节点上添加 `wx:ref="__mpxHost"`。
2. `packages/core/src/platform/builtInMixins/refsMixin.ios.js`
   - 扩展 `__selectRef()`，当 `refType === 'all'` 时跳过类型匹配，返回所有 selector 命中的 ref 实例。
3. `packages/api-proxy/src/platform/api/create-selector-query/rnSelectQuery.js`
   - `select()` / `selectAll()` 改为调用 `__selectRef(selector, 'all', all)`。
   - 将组件实例归一化为 `instance.__selectRef('__mpxHost', 'node')` 返回的 host `HandlerRef`。
4. `packages/core/src/platform/patch/getDefaultOptions.ios.js`
   - 原则上无需修改；如果落地时发现 host props/ref clone 时序问题，再在这里补充验证或微调。

## 测试方案

### 单元测试

建议补充 `packages/api-proxy` 或 `packages/core` RN selector 相关测试：

1. `select('#id')` 命中基础节点时保持原行为。
2. `select('#id')` 命中组件节点时返回组件 host `HandlerRef`，`boundingClientRect()` 可取到测量结果。
3. `selectAll('.item')` 同时命中基础节点和组件节点时返回数组，组件项解析为 host 节点。
4. `.a.b` 连续 class selector 命中组件节点时可以取交集。
5. `__selectRef(selector, 'all', all)` 返回基础节点 `HandlerRef` 与组件实例的混合结果，并保持连续 class 交集有效。
6. virtualHost 组件无 host ref 时返回 `null` / `[]`，不抛错。
7. `selectComponent('#id')` 仍返回组件实例，`selectAllComponents('.item')` 仍返回组件实例数组。

### 编译测试

建议在 `packages/webpack-plugin` RN 模板编译测试中补充：

1. 非 virtualHost 组件产物的自动 host 节点包含内部 ref，并注入 `getRefsData`。
2. virtualHost 组件产物不额外生成 host ref。
3. `customTextRules` 组件 host 为 `text` 时仍包含内部 ref。

### 集成验证

构造一个 RN 页面：

```xml
<template>
  <demo-card id="card" class="card" wx:ref data-index="1" />
  <view id="box" class="card" wx:ref />
</template>
```

验证：

1. `this.createSelectorQuery().select('#card').boundingClientRect()` 返回非空 rect。
2. `this.createSelectorQuery().select('.card').boundingClientRect()` 返回模板顺序下第一个匹配节点。
3. `this.createSelectorQuery().selectAll('.card').boundingClientRect()` 同时返回组件 host 和基础节点。
4. `this.selectComponent('#card')` 返回 `demo-card` 实例。

## 文档与 Skill 同步

该变更属于 Mpx2RN 对外脚本能力增强，正式实现时需要同步：

1. `docs-vitepress/` 中 RN selector / createSelectorQuery 相关文档：说明组件节点也可通过空 `wx:ref` 被 `createSelectorQuery.select()` 测量，结果对应组件实体 host 节点。
2. `.agents/skills/mpx2rn/references/rn-script-reference.md`：更新 selector 映射说明，补充组件节点 host 测量能力与 virtualHost 限制。

本文件仅为方案设计，不包含代码实现。
