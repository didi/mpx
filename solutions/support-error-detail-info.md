# 平台转换编译错误增强方案

## 背景

当前 `packages/webpack-plugin/lib/platform` 下的平台转换规则通过 `warn/error` 输出诊断信息，调用链大致如下：

- `platform/index.js` 创建 `spec`，将上层传入的 `warn/error` 注入到 `template/style/json` 的平台规则中。
- `platform/run-rules.js` 只负责命中规则并执行 processor，processor 内部直接调用闭包里的 `warn/error`。
- 上层 `processTemplate/processStyles/processJSON/json-compiler/pre-process-json` 只把信息包装成 `[Mpx xxx error][resource]: message`。

这种方式只能定位到资源文件，缺少行列号、源码片段、命中的转换规则、JSON path、模板节点、CSS selector/prop 等上下文。目标是在保持现有平台转换规则写法基本不变的前提下，让错误尽可能定位到精确位置，并输出更丰富、稳定、可测试的信息。

## 目标

- 平台转换产生的 warning/error 在源码位置可靠时带上 `file:line:column`，JSON 转换错误提供稳定的 key path。
- 对 template/style 这类能获得源码位置的错误输出 code frame，便于从终端直接定位问题。
- 尽可能补充结构化上下文：转换类型、目标平台、源平台、规则目标、JSON key path、模板标签/属性、CSS selector/property/value。
- 保持 `warn(msg)` / `error(msg)` 兼容，避免一次性改完所有规则调用。
- 诊断能力集中实现，避免在每个转换规则里拼接文件、行列、源码片段。

## 非目标

- 不改变平台转换规则的行为，只增强报错信息。
- 不把所有普通编译错误一次性纳入，本方案先覆盖 `packages/webpack-plugin/lib/platform` 规则体系。
- 不强制每条已有错误都手写位置参数，优先通过当前执行上下文自动推断。

## 总体设计

新增统一的诊断适配层：

```text
processTemplate/processStyles/processJSON
  -> getRulesRunner({ ..., diagnostic })
    -> createPlatformDiagnostic()
      -> spec({ warn, error })
      -> runRules(..., { diagnostic })
        -> diagnostic.withContext(ruleContext, () => processor(...))
          -> error(message, extra?)
```

诊断适配层负责三件事：

1. 收集当前规则执行上下文。
2. 将 `warn/error` 的 `message + extra` 归一化成诊断对象。
3. 根据模板 AST、PostCSS AST 与 sourcemap、JSON key path 推断定位信息并格式化输出。

推荐新增文件：

- `packages/webpack-plugin/lib/platform/create-diagnostic.js`
- `packages/webpack-plugin/lib/utils/source-location.js`

其中 `source-location.js` 提供通用能力：

- `offsetToPosition(source, offset)`：offset 转 1-based `{ line, column }`。
- `createCodeFrame(source, loc)`：基于仓库已有 `@babel/code-frame` 输出源码片段。
- `normalizeLoc(loc)`：兼容 offset、line/column、PostCSS source 三类位置。
- `originalPositionFor(map, loc)`：基于 sourcemap 将生成后的 CSS 位置回溯到原始样式源码。

## 诊断对象

内部统一使用如下结构：

```js
{
  type: 'template' | 'style' | 'json',
  severity: 'warning' | 'error',
  file: '/abs/path/to/file.mpx',
  message: 'React native environment does not support [tap] event!',
  loc: {
    start: { line: 10, column: 5 },
    end: { line: 10, column: 20 }
  },
  platform: {
    mode: 'ios',
    srcMode: 'wx'
  },
  target: {
    kind: 'attr',
    name: 'bindtap',
    value: 'handleTap',
    tag: 'view'
  },
  path: 'componentGenerics.list',
  rule: {
    test: '/^bind:?(.*)$/'
  },
  detail: [],
  hint: ''
}
```

对外仍然交给 webpack `emitWarning/emitError(new Error(message))`。格式建议：

```text
[Mpx template error][src/pages/index.mpx:10:5]: React native environment does not support [tap] event!

Target: <view bindtap="handleTap">
Mode: wx -> ios

  8 | <view class="page">
  9 |   <view class="title">hello</view>
>10 |   <view bindtap="handleTap">click</view>
     |        ^^^^^^^
 11 | </view>
```

如果无法获得行列号，降级为当前文件级别输出，并附带可用上下文，例如 JSON key path 或 selector。

## API 设计

### `getRulesRunner`

在 `packages/webpack-plugin/lib/platform/index.js` 中扩展参数：

```js
getRulesRunner({
  type,
  mode,
  srcMode,
  data,
  meta,
  warn,
  error,
  diagnostic: {
    file,
    source,
    sourceOffset,
    sourceMap
  }
})
```

`diagnostic` 为可选参数，不传时保持当前行为。创建 spec 时不再直接传原始 `warn/error`，而是传诊断适配后的方法：

```js
const reporter = createDiagnostic({
  type,
  mode,
  srcMode,
  warn,
  error,
  diagnostic
})
const spec = getSpec({
  warn: reporter.warn,
  error: reporter.error
})
```

### `runRules`

在 `packages/webpack-plugin/lib/platform/run-rules.js` 中透传当前规则上下文：

```js
diagnostic.withContext({
  mode,
  rule,
  input,
  data,
  meta,
  testKey,
  testInput
}, () => {
  result = processor.call(rule, input, data, meta)
})
```

这里需要保持无诊断适配层时的零侵入行为。实现上避免使用 object spread，延续仓库运行时代码约束，用 `Object.assign` 合并对象。

### `warn/error`

继续兼容原有调用：

```js
error('Ali environment does not support [tap] event!')
warn('Only @media rule is supported...')
```

允许逐步增强为：

```js
error('Ali environment does not support [tap] event!', {
  target: {
    kind: 'event',
    name: eventName
  },
  hint: '请改用目标平台支持的事件'
})
```

自动推断位置失败时，规则作者可以显式传入 `loc/path/node/decl/attr/el`：

```js
error('Property is invalid', {
  loc: decl.source && decl.source.start,
  target: {
    kind: 'css-decl',
    prop,
    value
  }
})
```

## Template 定位方案

模板侧最适合做到节点级和属性级定位。

现状：

- `parseHTML` 的 `parseStartTag` 已经记录了标签的 `match.start/match.end`。
- `options.start(tag, attrs, unary, match.start, match.end)` 已经把标签 offset 传了出来。
- `compiler.parse` 的 `start` 回调当前忽略了 `start/end` 参数，`createASTElement` 也没有保存位置信息。
- attrs 当前只保存 `{ name, value }`，没有属性 offset。

改造：

1. 在 `parseStartTag` 解析属性时记录属性起止 offset。

```js
const attrStart = index
advance(attr[0].length)
attr.start = attrStart
attr.end = index
```

2. 在 `handleStartTag` 生成 attrs 时带上位置信息。

```js
attrs[i] = {
  name: args[1],
  value: decode(value),
  start: args.start,
  end: args.end
}
```

如需要更精准地标到属性名或属性值，可额外计算 `nameStart/nameEnd/valueStart/valueEnd`，首期只做属性整体范围即可。

3. 在 `compiler.parse` 的 `start` 回调中保存元素位置。

```js
start: function start (tag, attrs, unary, start, end) {
  const element = createASTElement(tag, attrs, currentParent)
  element.start = start
  element.end = end
  element.loc = offsetToLoc(template, start, end)
}
```

4. 在 `normalize-component-rules.js` 执行每个 attr 规则前，把当前 attr 放进 data。

```js
const attrData = Object.assign({}, data, {
  el,
  attr,
  eventRules
})
```

这样现有 `error(msg)` 即可通过当前 rule context 自动定位到：

- `data.attr.loc`，优先用于属性、事件、指令相关错误。
- `data.el.loc`，用于标签转换错误。

5. 对嵌套的事件名规则补充上下文传递。

例如 `getRnDirectiveEventHandle` 内部调用 `runRules(eventRules, eventName, { mode, data: { el } })` 时，应继续传入 `attr` 与 `diagnostic`。否则 `eventRules` 内的错误只能回退到元素位置。

输出增强示例：

```text
[Mpx template error][src/pages/index.mpx:12:9]: Ali environment does not support [capture-bind] event handling!
Target: <button capture-bind:tap="onTap">
Attr: capture-bind:tap="onTap"
Mode: wx -> ali
```

## Style 定位方案

样式侧最终使用 PostCSS 解析，但平台转换拿到的 CSS 在进入 `react/style-helper.js` 之前已经经过了样式条件编译、less/sass/stylus 等预处理器以及 `style-compiler` 的 PostCSS 插件处理。因此 PostCSS 节点上的 `source.start/end` 只能代表当前生成 CSS 的位置，不能直接当作用户源码位置，必须结合 sourcemap 回溯。

现状：

- `style-compiler/index.js` 已经在 `this.sourceMap` 开启时通过 `options.map.prev = map` 串联上游 sourcemap，并在回调中返回 `result.map.toJSON()`。
- `react/processStyles.js` 通过 `loaderContext.importModule` 拉取 style 结果时，目前只拼接 CSS 内容，未同步保留每段 CSS 对应的 sourcemap。
- `react/style-helper.js` 中 `postcss.parse(content, { from: filename })` 只能拿到拼接后 CSS 的生成位置。
- `root.walkAtRules`、`root.walkRules`、`rule.walkDecls` 当前只把 `{ prop, value, selector }` 传给 `rulesRunner`。
- 平台规则内报错只能拿到 selector/prop/value 文本。

改造：

1. `processStyles` 不再只累加一个 `content` 字符串，而是收集样式片段：

```js
styleResults.push({
  content,
  map,
  resource: style.src || loaderContext.resourcePath
})
```

对于 `importModule` 返回的数组结果，需要在取 `item[1]` CSS 的同时保留当前 css-loader runtime list item 携带的 sourcemap；具体字段按当前 css-loader 输出结构兼容处理。多个 style 块不要先丢掉 map 后再 join，否则后面无法回溯到 less/sass/stylus 或原 `.mpx` 内联块。

2. `getClassMap` 接收 `styleResults` 或 `{ content, sourceMap }`，为每段 CSS 单独 `postcss.parse` 并执行规则，最后合并 `classMap`。避免把多段 CSS join 后再解析，因为 join 后的行列与各自 sourcemap 的 generated 位置不再天然一致。

```js
const classMap = getClassMap({
  styles: styleResults,
  filename: loaderContext.resourcePath,
  mode,
  srcMode,
  ctorType,
  warn,
  error,
  formatValueName
})
```

3. `rule.walkDecls` 传入声明节点与当前 style sourceMap：

```js
const input = {
  prop,
  value,
  selector: rule.selector,
  decl,
  rule,
  sourceMap
}
```

4. `root.walkAtRules` 报错时显式传 at-rule 节点：

```js
warn(`Only @media rule is supported...`, {
  node: rule,
  sourceMap,
  target: {
    kind: 'css-atrule',
    name: rule.name,
    params: rule.params
  }
})
```

5. `createDiagnostic` 自动识别生成位置，并优先用 sourcemap 回溯原始位置：

- `extra.node.source.start`
- `context.input.decl.source.start`
- `context.input.rule.source.start`
- `extra.sourceMap || context.input.sourceMap || diagnostic.sourceMap`

回溯成功时，输出 sourcemap 的 `source/line/column`，code frame 优先使用 `sourcesContent`；没有 `sourcesContent` 时再尝试从 webpack inputFileSystem 读取原文件。回溯失败时才降级到生成 CSS 的位置，并在 detail 中标记 `Generated position`。

6. selector 解析错误和 selector 限制错误优先定位到 `rule.source.start`，同时输出 `selector`。

输出增强示例：

```text
[Mpx style error][src/pages/index.mpx:32:3]: Only single class selector is supported in react native mode temporarily.
Selector: .a .b
Mode: wx -> ios
```

注意：样式条件编译当前发生在样式文件读取阶段，无法自然向 less/sass/stylus 传递一段前置 sourcemap。这里选择统一的保留行号实现方式：`strip-conditional` 不直接吞掉未命中内容里的换行，而是将控制注释和未命中分支的每一行替换为保留原缩进的 `/* STYLE_PAD_PLACEHOLDER */` marker 注释，让后续预处理器生成的 sourcemap 行号仍能对齐原始样式源码。Stylus 对大量连续空行存在栈溢出风险，marker 注释可以避免生成真正空行；`style-compiler` 的 PostCSS 链路末尾需要移除这些 marker，确保最终产物不包含占位注释。

同理，SFC 拆块时 `parseComponent` 对 `<style>` block 做 `pad: 'line'` 也不能再为 Stylus 直接补大量空行。样式 block 的 line pad 统一使用 `STYLE_PAD_PLACEHOLDER` marker 注释占位，继续保持行号，同时交由同一个 PostCSS 清理插件移除。

## JSON 定位方案

JSON 侧不需要提供行列号，输出 key path 即可满足定位诉求。这样可以避免为了 JSON5 的注释、尾逗号、单引号等语法额外引入 AST/token 定位复杂度，也能减少方案侵入。

方案：

1. 统一在诊断对象中提供 `path` 字段，格式使用点路径字符串或路径数组：

```js
{
  path: 'usingComponents.foo'
}
```

2. `platform/json/wx/index.js` 里已有很多 `pathArr` / `meta.paths`，例如 `deletePath`：

```js
const currPath = meta.paths.join('|')
print(mode, pathArr.concat(currPath).join('.'), isError)
```

这里可以在不改动大多数规则主体的情况下，由 `diagnostic` 根据当前 `data.pathArr + meta.paths` 推断 JSON key path。对于 `aliComponentGenericsValidate` 这类手动遍历规则，可逐步增强：

```js
error('Ali environment componentGenerics need to specify...', {
  path: ['componentGenerics', key]
})
```

输出增强示例：

```text
[Mpx json error][src/components/foo.mpx]: Ali environment componentGenerics need to specify a default custom component!
Path: componentGenerics.list
Mode: wx -> ali
```

## 格式化与兼容

上层 `emitWarning/emitError` 目前散落在多处：

- `react/processTemplate.js`
- `react/processStyles.js`
- `react/processJSON.js`
- `web/processJSON.js`
- `json-compiler/index.js`
- `utils/pre-process-json.js`

建议首期不大规模重构这些入口，只在构造 `getRulesRunner` 时传 `diagnostic`，并让原有 `warn/error` 接收已经格式化好的字符串。这样风险最小：

```js
const reporter = createDiagnostic({
  warn: msg => loaderContext.emitWarning(new Error(prefix + msg)),
  error: msg => loaderContext.emitError(new Error(prefix + msg)),
  diagnostic: {
    file: loaderContext.resourcePath,
    source: template.content
  }
})
```

后续可以再抽取 `createMpxEmitter(loaderContext, type)`，统一所有 `[Mpx xxx error]` 前缀。

## 分阶段落地

### 第一阶段：基础设施与 style

- 新增 `source-location.js`、`platform/create-diagnostic.js`。
- `getRulesRunner/runRules` 支持诊断上下文。
- `react/processStyles.js` 保留每段样式的 sourcemap，不再只拼接 CSS 字符串。
- `react/style-helper.js` 将 PostCSS `decl/rule/atRule` 与对应 sourcemap 传入诊断。
- 覆盖样式平台转换错误的原始源码行列和 code frame。

原因：style 既能较快验证 `diagnostic context + code frame` 的基础设施，又能优先解决 less/sass/stylus 与样式条件编译后位置失真的核心问题。

### 第二阶段：template

- 模板 parser 保存 element/attr offset。
- `normalize-component-rules.js` 传递当前 attr。
- 补齐嵌套 `runRules` 的诊断上下文。
- 覆盖事件、指令、组件属性、组件标签转换错误。

### 第三阶段：json

- 诊断层根据 `data.pathArr + meta.paths` 自动推断 JSON key path。
- `json/wx` 中少量手动遍历规则补充 `path` extra。
- JSON 错误输出保持文件级别加 `Path:`，不做行列和 code frame。

### 第四阶段：统一输出与测试补齐

- 抽取可复用的 `createMpxEmitter`。
- 补齐 template/style/json 三类核心用例。
- 更新快照或断言，确保 template/style 消息包含 `file:line:column`、code frame，JSON 消息包含 `Path:`，三类消息都包含关键上下文。

## 测试策略

只覆盖核心能力，不做全量平台规则测试：

- `platform/create-diagnostic.spec.js`
  - `error(msg)` 可以从当前 context 推断 loc。
  - `error(msg, { loc })` 优先使用显式 loc。
  - 无 loc 时降级为文件级消息。

- `react/style-helper.spec.js`
  - 非单 class selector 报错包含 selector 行列。
  - 不支持的 CSS prop/value 报错包含声明行列。
  - less/sass/stylus 或条件编译后的样式错误通过 sourcemap 回溯到原始源码位置。

- `template-compiler` 相关测试
  - 不支持事件报错定位到属性。
  - 不支持组件属性报错定位到属性。
  - 不支持标签报错定位到标签。

- `json` 相关测试
  - `componentGenerics` 缺少 default 报错包含对应 key path。
  - 被删除或不支持的配置项报错定位到 JSON path。

## 风险与注意点

- `.mpx` 内联块经过 `pad: 'line'` 后，行号通常能对齐原文件，列号在块首行可能需要额外 offset 修正。首期可先保证 template 行号正确，列号通过 block `start` 精修；JSON 不做行列定位。
- style 诊断依赖完整 sourcemap 链路，`processStyles`、css-loader runtime 结果、`style-compiler` 任一环节丢 map 都会导致回退到生成 CSS 位置；样式条件编译通过 marker 注释占位保持行号，不额外生成 sourcemap。最终产物必须在 PostCSS 阶段移除 `STYLE_PAD_PLACEHOLDER` 注释。
- 外链 `src` 的 template/style/json 应使用外链文件作为 `file/source`，不能继续用宿主 `.mpx` 文件。
- `runRules` 存在嵌套调用，诊断上下文需要用 stack，不能用单个全局变量。
- 诊断层不能改变 processor 的返回值与异常传播。
- 消息格式会影响已有测试断言，测试中只建议断言关键信息，不依赖完整字符串。

## 推荐优先级

建议按 `style -> template -> json` 的顺序实现。style 先把 sourcemap 链路打通，template 的精准属性定位收益最大，应第二阶段完成；json 只需要补 key path，放到第三阶段集中收尾即可。
