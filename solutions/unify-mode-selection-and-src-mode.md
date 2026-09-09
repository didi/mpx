# 统一 `mode` 筛选与 `srcMode` 转换语义技术实施方案

## 1. 背景

当前 `mode` 在不同条件编译层级中同时承担两类职责：

1. **目标筛选**：决定文件、SFC 区块、模板节点或属性是否在当前目标平台生效。
2. **源码方言声明**：部分场景会把命中的内容视为目标平台源码，跳过从项目 `srcMode` 到目标 `mode` 的跨平台转换。

两类职责耦合后产生了多套难以解释的行为：

- 文件条件编译：小程序平台文件会被视为目标平台源码，Web/RN 平台文件只参与筛选。
- SFC 区块条件编译：小程序平台区块会覆盖局部源码 mode，Web/RN 平台区块只参与筛选。
- 模板节点/属性条件编译：`@mode` 命中后跳过转换，`@_mode` 命中后继续转换。
- `modeRules` 实际用于批量指定资源的源码方言，但名称容易被理解为目标筛选规则。

这使开发者无法仅根据 `mode` 判断它是在“选择目标内容”还是“改变内容解释方式”，文档也不得不分别解释小程序、Web、RN 和 `_mode` 的差异。

## 2. 设计结论

统一后的核心原则为：

> `mode` 只负责目标筛选，`srcMode` 只负责源码方言。任何条件编译内容被选中后，默认都按照项目 `srcMode` 解释，并继续参与到目标 `mode` 的跨平台转换。

该原则覆盖全部条件编译层级：

| 层级 | 示例 | 统一后的含义 |
| --- | --- | --- |
| 文件 | `map.ali.mpx` | 仅在支付宝构建时优先选中 |
| SFC 区块 | `<template mode="ali">` | 仅在支付宝构建时选中 |
| 模板节点 | `<view @ali>` | 仅在支付宝构建时保留 |
| 模板属性 | `bindtap@ali="foo"` | 仅在支付宝构建时保留该属性 |

上述 `mode` 均不再改变源码方言。若项目配置为 `srcMode: 'wx'`，命中的内容仍按照微信/Mpx 规范进入 `wx -> ali` 转换。

`env` 始终只负责业务环境筛选，与源码方言及平台转换无关，本方案不改变其行为。

## 3. 目标与非目标

### 3.1 目标

- 文件、SFC 区块、模板节点和模板属性的 `mode` 全部统一为纯筛选。
- `@mode` 与 `@_mode` 行为完全一致，`@_mode` 仅作为历史语法兼容。
- 默认使用项目 `srcMode` 解释所有被选中的内容。
- 为确实使用目标小程序平台原生语法的实现提供显式源码方言声明能力。
- 将目标筛选与源码方言的配置、内部变量和文档术语明确分离。
- 保持 Android/Harmony 文件条件编译回退到 iOS 文件的能力。
- 同步更新公开文档及 Mpx2RN Skill。

### 3.2 非目标

- 不扩大编译器当前支持的源码方言范围。
- 不把 RN 原生 JSX、React Native StyleSheet 或 Web 原生 Vue SFC 语法定义为 Mpx 模板源码；显式 `src-mode="ios"` 的模板区块使用已注册的 RN 原生组件与属性，不再执行 Mpx2RN 模板转换。
- 不改变 `env` 的匹配、优先级及组合规则。
- 不修改具体平台转换规则的能力事实，除非审计发现现有规则对目标平台合法语法存在误处理。
- 不在本次变更中删除 `@_mode` 或旧 `modeRules` 配置。
- 不改变代码维度 `__mpx_mode__`、`__mpx_env__` 的含义。

## 4. 统一语义

### 4.1 默认行为

项目配置：

```js
new MpxWebpackPlugin({
  mode: 'ali',
  srcMode: 'wx'
})
```

以下三种条件编译内容都按照微信/Mpx 规范编写：

```html
<!-- 文件 map.ali.mpx 中的内容 -->
<view bindtap="handleTap" />

<!-- SFC 区块 -->
<template mode="ali">
  <view bindtap="handleTap" />
</template>

<!-- 节点/属性 -->
<view @ali bindtap="handleTap" />
<view bindtap@ali="handleTap" />
```

命中后均继续执行平台转换，支付宝产物中的事件为 `onTap`。

### 4.2 `@_mode` 兼容

`@_mode` 继续被解析，但 `_` 不再影响转换行为：

```html
<view @ali bindtap="handleTap" />
<view @_ali bindtap="handleTap" />
```

两者产物完全一致。新增代码和文档示例统一使用 `@mode`，本次不增加弃用警告。

### 4.3 目标平台特有语法

纯筛选不代表禁止使用目标平台特有语法，分两类处理：

1. **增量使用目标平台特有节点或属性**
   - 使用 `mode` / `@mode` 限定目标平台。
   - 若转换规则不匹配该目标语法，内容会原样保留。
   - 转换规则不得错误删除或二次改写目标平台合法语法。

2. **完整实现已经按照目标小程序平台方言编写**
   - 显式声明局部源码方言，避免依赖 `mode` 的隐式副作用。
   - 文件和 SFC 区块使用独立的 `srcMode` 能力，见第 5 节。

若某个目标平台原生属性与现有转换规则冲突，优先修正规则，使目标平台合法输入具备稳定的直通能力；不重新让 `@mode` 承担“跳过转换”的隐式职责。无法局部直通时，将完整实现隔离到显式 `srcMode` 文件或区块。

### 4.4 Web/RN 原生实现边界

Web/RN 条件文件或区块仍默认按照项目 `srcMode` 编写并进入 Mpx 转换链路。

- Web 原生 Vue 实现应继续使用已有 Web 原生组件或独立 Vue 文件接入方式。
- RN 模板区块显式声明 `src-mode="ios"` 时，模板使用已注册的 `View`、`Text` 等 RN 原生组件及其原生属性和事件，不执行 Mpx2RN 模板转换。
- RN 原生组件的注册以及 Hooks、JSX、StyleSheet 等能力继续使用 Mpx 与 RN 混合开发链路；`src-mode="ios"` 不会把 Mpx 模板区块变成 JSX 或 StyleSheet。

## 5. 显式源码方言能力

### 5.1 SFC 区块

新增区块属性 `src-mode`，内部统一归一化为 `srcMode`：

```html
<template mode="ali" src-mode="ali">
  <view onTap="handleTap">支付宝原生模板</view>
</template>
```

语义分别为：

- `mode="ali"`：仅支付宝构建选中该区块。
- `src-mode="ali"`：该区块已经使用支付宝源码方言，不执行 `wx -> ali` 转换。

约束：

- `src-mode` 不参与区块筛选和优先级计算。
- `src-mode` 仅在等于当前输出 `mode` 时采纳，否则忽略。
- SFC 区块未声明时继承资源 `srcMode`。
- template、style、script、JSON 区块使用同一套解析和透传规则，但各编译器是否消费 `srcMode` 仍按现有能力执行。
- `.mpx` 的 `<template src>` 仍属于 SFC 模板区块，继承资源 `srcMode` 并读取显式 `src-mode`。
- 模板内容中的 `<template name>` 继承当前区块 `srcMode`；`<import>` / `<include>` 引用的独立模板资源不继承引用方 `srcMode`，其源码方言由自身命中的 `srcModeRules` 决定。

### 5.2 文件与第三方资源

新增配置 `srcModeRules`，替代名称含混的 `modeRules`：

```js
new MpxWebpackPlugin({
  mode: 'ali',
  srcMode: 'wx',
  srcModeRules: {
    ali: {
      include: [
        /src\/ali-native\//,
        /node_modules\/vant-aliapp/
      ]
    }
  }
})
```

含义是：匹配资源按 `ali` 源码方言处理，与当前构建目标是否为 `ali` 是两个独立概念。

实施约束：

- `srcModeRules` 的 key 是输出平台；构建时只消费当前输出 `mode` 对应的规则。
- 规则命中后将资源 `srcMode` 标记为当前输出 `mode`，其他平台规则在本次构建中忽略。
- 规则只写入内部 `srcMode` query，不参与文件选择。
- 旧 `modeRules` 保留兼容，并按原有行为映射为 `srcModeRules`。
- 同时配置两者时，建议直接报配置冲突，避免优先级不透明。
- 文档将 `modeRules` 标记为兼容配置，不在本次增加运行时弃用警告。

### 5.3 文件名不隐含源码方言

`.ali.mpx` 仅用于支付宝目标文件选择，不等价于 `srcMode = ali`。

如果文件内容已经是支付宝原生源码，必须通过 `srcModeRules.ali` 显式声明。这样文件命名只表达“何时选中”，配置只表达“如何解释”，避免同一信息继续隐式承担两个职责。

## 6. 实现设计

### 6.1 文件条件编译

修改：

- `packages/webpack-plugin/lib/index.js`
- `packages/webpack-plugin/lib/resolver/AddModePlugin.js`

调整：

1. 所有目标平台均按当前 Web/RN 的方式解析条件文件。
2. `AddModePlugin` 始终只写入目标平台 infix，不再通过目标 `mode` 覆盖资源源码方言。
3. 将内部 `implicitMode` 改为能体现纯筛选行为的名称，或在统一后直接删除该分支。
4. Android/Harmony 继续回退查找 `.ios.*`，回退只影响文件选择，不改变源码方言。
5. 已解析请求的去重判断只依据 infix 和目标选择状态。

### 6.2 SFC 区块条件编译

修改：

- `packages/webpack-plugin/lib/helpers.js`
- `packages/webpack-plugin/lib/parser.js`
- Web/RN 及小程序 block 请求的相关处理链路

调整：

1. 删除 `part.mode` 写入 block request 源码 mode 的逻辑。
2. `part.mode` 仅在 SFC 解析阶段参与区块选择。
3. SFC 区块解析并透传显式 `part.srcMode`，包括 `<template src>`。
4. SFC 区块未声明 `src-mode` 时由实现侧统一回退到资源 `srcMode`，调用侧不重复兜底。
5. 模板内容中的 `<import>` / `<include>` 请求不透传引用方 `srcMode`，由被引用资源自身匹配 `srcModeRules`。
6. 各 block 编译器接收统一命名的 `srcMode`，避免继续使用含义混杂的 `mode` query。

### 6.3 模板节点与属性条件编译

修改：

- `packages/webpack-plugin/lib/template-compiler/compiler.js`

当前匹配状态：

```js
MISMATCH
IMPLICITMATCH
MATCH
```

统一后只保留：

```js
MISMATCH
MATCH
```

调整：

1. `@mode` 与 `@_mode` 使用相同的条件匹配状态。
2. `_` 只在解析兼容语法时剥离，不再决定是否转换。
3. 删除仅用于跳过属性转换的 `noTransAttrs` 暂存和恢复逻辑。
4. 命中的节点和属性正常进入一次平台规则转换。
5. 未命中的节点和属性继续删除。
6. mode + env、多分支、`mpxTagName`、父子节点独立匹配行为保持不变。

### 6.4 `modeRules` 迁移

修改：

- `packages/webpack-plugin/lib/index.js`
- 配置类型声明及公开 API 文档

建议新增独立方法 `runSrcModeRules()`：

1. 读取 `srcModeRules`。
2. 兼容读取旧 `modeRules` 并归一化。
3. 向 resource/request 写入内部 `srcMode` query。
4. 后续编译链路逐步以 `queryObj.srcMode` 为准。
5. 删除历史 resource `mode` query 的写入和读取，不保留 `queryObj.mode` 兼容；loader 自身用于选择构建目标的 `?mode=` 参数不属于资源源码方言。

不能只做变量改名：需要检查所有消费 `queryObj.mode` 的 loader、compiler、cache key 和 resolver 去重逻辑，确保它们使用的是源码方言而非构建目标。

## 7. 转换规则风险审计

统一语义的主要风险是历史目标平台源码重新进入转换链路。实施前后必须扫描：

- `packages/webpack-plugin/lib/platform/template/`
- `packages/webpack-plugin/lib/platform/json/`
- `packages/webpack-plugin/lib/platform/style/`
- Web/RN 各 process 模块
- 用户可配置的自定义平台规则入口

重点检查：

1. **非幂等重命名**：目标属性再次被改名。
2. **值转换**：规则不区分来源，仅根据属性名修改目标平台合法值。
3. **删除规则**：错误删除目标平台支持的节点、属性或 JSON 字段。
4. **组件替换**：目标组件再次进入源组件替换规则。
5. **诊断规则**：目标平台合法语法产生错误或警告。
6. **JSON 结构转换**：目标字段被重复迁移、合并或删除。
7. **WXS 方言**：目标平台脚本模块后缀、标签和引用被重复转换。

审计结论应分为：

- 可安全直通：目标语法不匹配源规则或规则结果稳定。
- 需要修正规则：目标语法合法但会被误处理。
- 必须显式 `srcMode`：完整内容属于另一源码方言，不能混合转换。

不为所有规则增加全局“已转换”标记；具体风险应在对应规则中最小修复。

## 8. 兼容性与迁移

### 8.1 保持兼容

- `@_mode` 仍可解析。
- 未命中的文件、区块、节点和属性仍被正确排除。
- `env` 行为不变。
- Android/Harmony 文件回退行为不变。
- `modeRules` 在兼容期继续生效。
- 未使用目标平台原生源码的项目，条件编译结果仅表现为统一执行正常跨平台转换。

### 8.2 Breaking Changes

以下旧代码依赖了 `mode` 的隐式源码方言语义：

```html
<template mode="ali">
  <view onTap="handleTap" />
</template>
```

```html
<view @ali onTap="handleTap" />
```

```text
map.ali.mpx  // 文件内容全部按支付宝原生规范编写
```

迁移方式：

1. 优先改为项目 `srcMode` 语法，让框架正常转换。
2. 目标平台增量语法若能安全直通，继续配合 `mode` 使用。
3. 完整目标小程序原生区块增加 `src-mode="ali"`。
4. 完整目标小程序原生文件通过 `srcModeRules.ali` 显式标记。
5. RN 原生模板区块使用 `src-mode="ios"` 并注册所需 RN 组件；Hooks、JSX、StyleSheet 等实现继续使用混合开发链路，Web 原生实现继续使用对应原生组件接入方式。

该变更建议随主版本发布；若必须在次版本引入，应先提供配置开关并保留一个完整迁移周期。

### 8.3 可选的过渡开关

如需要渐进迁移，可暂时提供：

```js
legacyModeAsSrcMode: true
```

开启后恢复旧的文件、区块和 `@mode` 转换语义。该开关只用于迁移，不应成为长期双轨能力，并需在下一主版本移除。

若决定直接以主版本发布，可以不实现此开关，避免长期维护两套语义。

## 9. 测试方案

### 9.1 文件条件编译

- wx/ali/swan/qq/tt/jd 条件文件只影响选择，不覆盖项目 `srcMode`。
- web/ios/android/harmony 保持当前纯筛选行为。
- Android/Harmony 正确回退 `.ios.*`。
- 默认文件与平台文件的选择优先级不变。
- `srcModeRules` 能显式指定目标小程序源码方言。
- `modeRules` 兼容映射结果与旧行为一致。
- `srcModeRules` 只应用当前输出 `mode` 对应的资源规则。

### 9.2 SFC 区块

template、script、style、JSON 分别覆盖：

- `mode` 命中后继承项目 `srcMode`。
- `mode` 未命中时不参与编译。
- `env` 只参与筛选，不改变 `srcMode`。
- `mode + env` 组合不改变 `srcMode`。
- `src-mode` 能显式覆盖区块源码方言。
- `<template src>` 继承资源 `srcMode` 并读取区块显式 `src-mode`。
- `<template name>` 继承当前区块 `srcMode`。
- `<import>` / `<include>` 不继承引用方 `srcMode`，同一资源不会因引用方不同而产生两种源码解释。
- 被 `<import>` / `<include>` 引用的模板能通过自身命中的 `srcModeRules` 声明源码方言。

### 9.3 节点与属性

- `@mode` 与 `@_mode` 在节点、属性、mode + env、多分支场景产物一致。
- 命中后执行一次平台转换。
- 未命中节点和属性正常删除。
- `mpxTagName@mode` 保持标签替换能力。
- 父节点条件不影响子节点独立转换。
- 支付宝、Web、RN 各覆盖一个组件、事件和属性转换代表用例。

### 9.4 目标平台语法直通

- 目标平台合法且不需要转换的属性原样保留。
- 目标平台合法节点不会被错误删除或替换。
- 目标平台 JSON 字段不会被错误迁移或删除。
- 发现不安全规则时，为具体规则补充最小回归测试。

### 9.5 配置与缓存

- `srcMode` 进入 parser/compiler cache key，避免不同源码方言复用错误缓存。
- resource query 中目标 `mode` 与源码 `srcMode` 不混用。
- `srcModeRules` 修改后 watch 模式能正确失效并重新编译。
- production/development 构建结果一致。

## 10. 文档与 Skill 同步

### 10.1 官方文档

修改：

- `docs-vitepress/guide/cross-platform/conditional.md`
- `docs-vitepress/guide/advance/platform.md`
- `docs-vitepress/api/directives.md`
- `docs-vitepress/api/compile.md`
- 其他搜索到 `@_mode`、`modeRules` 和“目标平台语法”旧描述的页面

统一说明：

- `mode` 在文件、区块、节点和属性层级均只参与筛选。
- 被选中内容默认按照项目 `srcMode` 编译。
- `@_mode` 是 `@mode` 的兼容别名。
- `src-mode` 用于 SFC 区块显式声明源码方言。
- `srcModeRules` 用于文件和第三方资源显式声明源码方言。
- `<template src>` 读取 SFC 区块的 `src-mode`；模板内部 `<import>` / `<include>` 不继承引用方 `srcMode`。
- `env` 只参与环境筛选。
- 增加旧语义迁移示例。

不新增、删除或重命名文档文件时，无需修改侧边栏和目录索引。

### 10.2 Mpx2RN Skill

修改：

- `.agents/skills/mpx2rn/SKILL.md`
- `.agents/skills/mpx2rn/references/conditional-compile.md`
- `.agents/skills/mpx2rn/references/rn-hybrid-dev.md`

统一说明：

- RN 文件、区块和 `@mode` 都只参与筛选。
- 命中内容继续按照项目 `srcMode` 进入 RN 转换。
- `@_mode` 仅作为兼容语法。
- `src-mode="ios"` 的模板区块使用已注册的 RN 原生组件；RN 原生 JSX/StyleSheet 继续使用混合开发能力。
- 模板内部 `<import>` / `<include>` 不继承引用方的 `srcMode`，RN 原生外部模板需由自身命中的 `srcModeRules` 声明。

## 11. 实施顺序

建议拆成四个可独立验证的阶段，避免同时改动全部 request 语义：

1. **节点/属性纯筛选**
   - 更新测试。
   - 合并 `@mode` / `@_mode` 状态。
   - 删除跳过转换逻辑。

2. **文件与区块纯筛选**
   - 所有平台文件解析统一为不覆盖 `srcMode`。
   - 删除区块 `part.mode` 覆盖源码方言的逻辑。
   - 建立 template/script/style/JSON 回归测试。

3. **显式源码方言**
   - 增加区块 `src-mode`。
   - 增加 `srcModeRules`，兼容 `modeRules`。
   - 梳理内部 query 命名、缓存和非法组合校验。

4. **规则审计与对外同步**
   - 扫描模板、JSON、样式、WXS 规则。
   - 修复具体非幂等或误删除问题。
   - 更新文档、迁移说明和 Mpx2RN Skill。

每个阶段完成后单独提交并通过相关测试，避免在问题出现时无法判断来自条件匹配、request 透传还是平台规则。

## 12. 校验命令

以实施时实际改动文件为准，至少执行：

```sh
npx eslint \
  packages/webpack-plugin/lib/index.js \
  packages/webpack-plugin/lib/helpers.js \
  packages/webpack-plugin/lib/parser.js \
  packages/webpack-plugin/lib/resolver/AddModePlugin.js \
  packages/webpack-plugin/lib/template-compiler/compiler.js \
  packages/webpack-plugin/test/platform/common/mode.spec.js
```

```sh
npx jest \
  packages/webpack-plugin/test/platform/common/mode.spec.js \
  packages/webpack-plugin/test/block-mode-src-mode.spec.js \
  packages/webpack-plugin/test/helpers.spec.js \
  --runInBand \
  --no-watchman
```

根据新增的 resolver、parser、Web 和 RN 测试补充对应 Jest 文件。

```sh
npm run docs:build
```

若测试失败，仅按仓库约束进行最多两轮修复；仍不通过时停止并记录完整错误和原因分析。

## 13. 验收标准

- 文件、区块、节点和属性的 `mode` 均只影响筛选。
- 条件命中的文件与 SFC 区块默认继承资源 `srcMode` 并执行一次目标平台转换，`<template src>` 读取区块的 `src-mode`。
- 模板内部 `<import>` / `<include>` 不继承引用方 `srcMode`，其源码方言由被引用资源自身决定。
- `env` 不改变源码方言。
- `@mode` 与 `@_mode` 产物一致。
- `IMPLICITMATCH`、`noTransAttrs` 和容易混淆的 resolver `implicitMode` 不再存在。
- 区块 `src-mode` 能显式声明源码方言。
- `srcModeRules` 能显式标记文件和第三方资源，`modeRules` 保持兼容。
- 目标平台合法增量语法能够稳定直通。
- Android/Harmony 文件回退行为不变。
- Web/RN 原生实现边界有明确文档，RN 原生模板区块与 JSX/StyleSheet 混合开发链路区分清晰。
- 相关 ESLint、Jest 和文档构建全部通过。
- 官方文档与 Mpx2RN Skill 不再描述 `mode` 会隐式改变源码方言。
