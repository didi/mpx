# Iteration 8 执行结果汇总

## 模型信息

- **执行模型**：Claude Sonnet
- **评分方式**：grade.py 脚本自动评分（基于正则/文本匹配断言）

## 概览

本轮评估包含 6 个 eval，共 63 条断言。对比组包括：

- `no_skill`：不使用 skill 的 baseline
- `mpx2rn_original`：使用原版 `mpx2rn` skill
- `mpx2rn_gene`：使用 `mpx2rn-gene` skill

整体结果：

| 分组 | 通过数 | 总数 | 通过率 | 总 Tokens | 平均耗时 (s) | 平均工具调用 |
| --- | ---: | ---: | ---: | ---: | ---: | ---: |
| `no_skill` | 39 | 63 | 61.90% | 142,780 | 81.6 | 4.0 |
| `mpx2rn_original` | 60 | 63 | 95.24% | 441,366 | 239.4 | 21.0 |
| `mpx2rn_gene` | 52 | 63 | 82.54% | 373,517 | 153.4 | 17.8 |

结论：`mpx2rn_original` 当前表现最好，仅 3 条断言失败；`mpx2rn_gene` 明显优于 baseline，但在模板事件传参、dataset 清理、部分样式条件编译细节上仍有回退；`no_skill` 在复杂跨端细节上遗漏较多。`mpx2rn_gene` 比 `mpx2rn_original` 快 36%（平均 153s vs 239s），token 消耗少 15%。

## Eval 设计说明

eval-0~2 为**常规复杂度**，分别侧重单一维度；eval-3~5 为**刁钻复杂度**，每个覆盖全部维度（style+template+script+json），需深度阅读 skill 细节才能正确处理。

| Eval | 名称 | 复杂度 | 侧重维度 | 设计倾向 |
| --- | --- | --- | --- | --- |
| eval-0 | style-adaptation | normal | style | RN 不支持的选择器/伪类/伪元素/组合器清理，font-weight 数值转换，条件编译语法正确性 |
| eval-1 | template-adaptation | normal | template | 动态类绑定、事件参数内联传递（消除 dataset）、页面滚动替换 scroll-view、模板中无方法调用、wx:style camelCase |
| eval-2 | script-json-adaptation | normal | script/json | wx→mpx API 替换、不支持的生命周期条件编译隔离、dataset 清理、JSON enablePullDownRefresh 处理 |
| eval-3 | gradient-animation-interaction | tricky | 全维度 | 渐变 transparent→rgba、display:none 替换、transition 动态属性、enable-background/enable-animation、异步生命周期、@keyframes 条件编译 |
| eval-4 | text-layout-selector | tricky | 全维度 | flex-direction 显式声明、sticky 替换、单位注释保留、内联样式简写限制、wx:ref 添加、选择器 API 简化、catch 事件前缀、radial-gradient |
| eval-5 | conditional-compile-advanced | tricky | 全维度 | 条件编译不产生空选择器、font-family 单一字体、border 统一设置、selectComponent wx:ref、CSS 变量 enable-var、toRefs 响应式、background-repeat、text-decoration 条件编译 |

## 分 Eval 结果

| Eval | 侧重点 | `no_skill` | `mpx2rn_original` | `mpx2rn_gene` |
| --- | --- | ---: | ---: | ---: |
| eval-0 style-adaptation | style | 10/14 | 13/14 | 14/14 |
| eval-1 template-adaptation | template | 5/9 | 9/9 | 6/9 |
| eval-2 script-json-adaptation | script/json | 6/9 | 9/9 | 7/9 |
| eval-3 gradient-animation-interaction | style/template/script/json | 8/10 | 10/10 | 10/10 |
| eval-4 text-layout-selector | style/template/script/json | 6/10 | 9/10 | 7/10 |
| eval-5 conditional-compile-advanced | style/template/script/json | 4/11 | 10/11 | 8/11 |

## 失败项明细

### eval-0 style-adaptation

`mpx2rn_original` 失败：

- `s6`：style: numeric font-weight (500/600) replaced with bold/normal

`mpx2rn_gene` 全部通过。

`no_skill` 失败：

- `s6`：style: numeric font-weight (500/600) replaced with bold/normal
- `s7`：style: text-overflow/white-space dual-track with numberOfLines on RN
- `s8`：template: real node added to replace ::before pseudo-element
- `s12`：style on RN: no multi-class selector (.a.b)

### eval-1 template-adaptation

`mpx2rn_original` 全部通过。

`mpx2rn_gene` 失败：

- `t1`：template: event params use inline syntax (not data- dataset)
- `t6`：script: no e.target.dataset usage
- `t8`：template: wx:style object keys use unquoted camelCase (no quoted or kebab-case keys)

`no_skill` 失败：

- `t0`：template: dynamic class via wx:class (not class string interpolation)
- `t2`：template: no method calls in Mustache (getStatusColor/getStatusText replaced)
- `t3`：template: page scroll replaced with scroll-view
- `t4`：template: scroll-view has bindscrolltolower or equivalent

### eval-2 script-json-adaptation

`mpx2rn_original` 全部通过。

`mpx2rn_gene` 失败：

- `j5`：script: no e.target.dataset usage
- `j8`：template: data- attributes removed (inline event params used)

`no_skill` 失败：

- `j3`：script: setTabBarBadge/removeTabBarBadge isolated with conditional compile
- `j8`：template: data- attributes removed (inline event params used)
- `j9`：script: onShareAppMessage preserved (RN supported, should not be removed)

### eval-3 gradient-animation-interaction

`mpx2rn_original` 与 `mpx2rn_gene` 全部通过。

`no_skill` 失败：

- `g3`：template: 动态 background-image 的 view 添加 enable-background
- `g4`：template: 动态 transition 的 view 添加 enable-animation

### eval-4 text-layout-selector

`mpx2rn_original` 失败：

- `l4`：template: 内联 style 中不使用多值 margin/padding 简写

`mpx2rn_gene` 失败：

- `l4`：template: 内联 style 中不使用多值 margin/padding 简写
- `l8`：script: 非触摸事件不使用 catch 前缀
- `l9`：style: radial-gradient 条件编译或替换

`no_skill` 失败：

- `l2`：style: 保留 `/*use rpx*/` `/*use px*/` 单位转换注释
- `l4`：template: 内联 style 中不使用多值 margin/padding 简写
- `l5`：template: scroll-into-view 目标添加 wx:ref
- `l6`：template: createSelectorQuery 目标添加空 wx:ref

### eval-5 conditional-compile-advanced

`mpx2rn_original` 失败：

- `c2`：style: border-style 统一设置不使用单边

补充说明：该失败不是 `.method-selector` 的条件编译分支导致，而是 `.form-item` 中仍存在 RN 有效样式 `border-bottom-style: solid;`。

`mpx2rn_gene` 失败：

- `c2`：style: border-style 统一设置不使用单边
- `c7`：style: background-repeat 仅使用 no-repeat
- `c9`：style: text-decoration-style/color 条件编译处理

`no_skill` 失败：

- `c0`：style: @mpx-if 包裹完整规则不产生空选择器
- `c1`：style: font-family 使用单一字体名
- `c2`：style: border-style 统一设置不使用单边
- `c3`：template: 内联 style 不使用 border 简写
- `c4`：template: selectComponent 目标自定义组件添加 wx:ref
- `c7`：style: background-repeat 仅使用 no-repeat
- `c9`：style: text-decoration-style/color 条件编译处理

## 执行耗时 & Token 消耗 & 工具调用次数

| Eval | Group | Tokens | Tool Calls | Duration (s) |
|------|-------|-------:|----------:|-----------:|
| eval-0 | no_skill | 21,106 | 4 | 71.7 |
| eval-0 | mpx2rn_original | 57,549 | 19 | 211.2 |
| eval-0 | mpx2rn_gene | 29,257 | 13 | 82.9 |
| eval-1 | no_skill | 24,196 | 4 | 72.1 |
| eval-1 | mpx2rn_original | 89,038 | 35 | 413.5 |
| eval-1 | mpx2rn_gene | 54,484 | 18 | 148.7 |
| eval-2 | no_skill | 21,654 | 4 | 69.1 |
| eval-2 | mpx2rn_original | 69,800 | 24 | 240.7 |
| eval-2 | mpx2rn_gene | 75,275 | 19 | 140.5 |
| eval-3 | no_skill | 22,046 | 3 | 68.6 |
| eval-3 | mpx2rn_original | 79,730 | 21 | 200.8 |
| eval-3 | mpx2rn_gene | 72,549 | 20 | 151.9 |
| eval-4 | no_skill | 23,244 | 4 | 80.5 |
| eval-4 | mpx2rn_original | 66,820 | 16 | 188.6 |
| eval-4 | mpx2rn_gene | 73,936 | 16 | 147.5 |
| eval-5 | no_skill | 30,534 | 5 | 127.3 |
| eval-5 | mpx2rn_original | 78,429 | 11 | 181.7 |
| eval-5 | mpx2rn_gene | 68,016 | 21 | 249.1 |

### 分组汇总统计

| Group | 总 Tokens | 平均 Tokens | 总 Tool Calls | 平均 Tool Calls | 总耗时 (s) | 平均耗时 (s) |
|-------|----------:|------------:|--------------:|----------------:|-----------:|-------------:|
| no_skill | 142,780 | 23,797 | 24 | 4.0 | 489.3 | 81.6 |
| mpx2rn_original | 441,366 | 73,561 | 126 | 21.0 | 1,436.5 | 239.4 |
| mpx2rn_gene | 373,517 | 62,253 | 107 | 17.8 | 920.6 | 153.4 |

### 效率分析 (得分/token)

| Group | 总得分 | 总 Tokens | 得分/万token |
|-------|--------|----------:|------------:|
| no_skill | 39/63 | 142,780 | 2.73 |
| mpx2rn_original | 60/63 | 441,366 | 1.36 |
| mpx2rn_gene | 52/63 | 373,517 | 1.39 |

### 速度对比

- **no_skill** 平均 81.6s，token 最少但得分最低
- **mpx2rn_gene** 平均 153.4s，比 original 快 **36%**（因 gene 文档更紧凑）
- **mpx2rn_original** 平均 239.4s，得分最高但耗时最长

## 主要观察

- 原版 `mpx2rn` skill 对模板、脚本、JSON 的稳定性最好，尤其 eval-1、eval-2、eval-3 均满分。
- `mpx2rn_gene` 在 eval-0 和 eval-3 表现很好，说明紧凑策略对部分样式/复杂交互约束有效；但对 dataset 清理、内联事件传参、`wx:style` 对象 key、非触摸 catch 事件等细节覆盖不足。
- baseline 在基础样式改造之外的跨端语义约束上遗漏明显，尤其页面滚动替换、selector `wx:ref`、JSON/脚本条件编译和 RN 特有模板属性。
- 后续若继续优化 gene 版，优先补齐模板事件传参与 dataset 移除、内联样式简写限制、样式条件编译中的 RN 有效样式清理这三类高频失分点。
