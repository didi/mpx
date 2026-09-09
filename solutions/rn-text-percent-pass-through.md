# 需求目标

解决 RN 基础组件中本地文本样式百分比无法拿到透传继承 `font-size` 的问题，同时保持 `useTextPassThrough` 的既有模型：祖先节点透传下来的 `textStyle` 已经由祖先节点完成非文本继承相关转换，当前节点只用它作为继承值和文本百分比基数，不把继承样式放进当前节点的 `useTransformStyle` 流程二次转换。

成功标准：

- 当前组件本地 `fontSize: '50%'` / `lineHeight: '150%'` / `font: '50%/1.5 Arial'` 等文本相关百分比，在 text pass-through 阶段基于明确的文本字号基数解析；基数优先级为解析后的当前 `fontSize` number -> inherited `textStyle.fontSize` number -> `16`。其中 `16` 表示 RN number `16` / CSS 语义的 16px 基准，`font` 简写里的 unit-less `line-height` 必须先规范化为百分比字符串中间态，例如 `1.5` -> `'150%'`。
- `fontSize` / `lineHeight` / `font` 简写中与字体继承相关的百分比不再在 `useTransformStyle` 的通用 percent 阶段解析。
- 透传继承来的 `textStyle` 不参与当前 `useTransformStyle` 的 css var、percent、calc、font shorthand 等转换。
- 非 text pass-through 场景继续由现有 `useTextPassThrough` 的 `shouldEnableTextPassThrough` 控制，不新增 transform 前的 `TextPassThroughContext` 订阅。
- RN 最终 style 中不残留非法的 `lineHeight: '150%'` 这类百分比字符串；缺少字体基数时使用 `16` 兜底解析，只有值本身不是可识别百分比/长度等非法格式时才按现有风格告警或丢弃。
- Hook 调用顺序稳定，运行时代码不使用 object spread 合并对象。

# 背景与约束

- 旧链路通常是 `useTransformStyle(styleObj, { parentFontSize, ... })` -> `splitStyle(normalStyle)` -> `useTextPassThrough(textStyle, textProps, ...)`。`useTransformStyle` 执行时还没有读取 `TextPassThroughContext`，所以本地 `fontSize` 百分比只能依赖 props 上的 `parent-font-size`。最终实现已移除这条辅助 prop 依赖，改为在文本透传阶段使用 inherited text fontSize 或默认 `16` 解析。
- 上一版方案尝试在 `useTransformStyle` 前按需读取继承 `fontSize`，但仍需要前置 `hasTextStyle` 判断，并额外引入 transform 前 helper。用户第 3 轮反馈该方案不够集中：同一文本透传需求会在 transform 前和 `useTextPassThrough` 中各判断一次，还增加了前置订阅路径。
- 新方案接受该判断：普通非 text 组件的文本继承相关百分比延后到 `useTextPassThrough` 拿到完整 inherited text 信息之后解析；`mpx-text.tsx` 作为 Text 消费端直接读取 `TextPassThroughContext` 并在本组件内完成编排。`useTransformStyle` 仍负责 css var、env、calc、radius/gap 等原有转换，但不提前解析 `fontSize` / `lineHeight` 的百分比。
- `transformFont` 仍负责把 RN 可识别的 `font` 简写展开为 `fontSize`、`lineHeight`、`fontFamily`、`fontWeight`、`fontStyle`、`fontVariant` 等长属性；但字体继承相关的百分比和 unit-less line-height 不在这里立即数值化，unit-less line-height 需先转成百分比字符串中间态。
- `useTextPassThrough` 当前通过 `enableTextPassThrough || !!textStyle || !!textProps` 决定是否订阅 `TextPassThroughContext`，并用 `useRef` 锁定首轮启用状态。本次必须保持该订阅边界：没有 textStyle、没有 textProps、没有 `enable-text-pass-through` 时仍不订阅。
- 不把 inherited `textStyle` 当作待 transform 样式输入，不做二次 CSS var / calc / font transform；inherited text 只参与文本继承合并和文本百分比基数计算。
- 遵守仓库约束：优先复用 `utils.tsx` 现有工具与组件调用模式；对象合并使用 `extendObject` / `Object.assign`；新增测试只覆盖核心功能；相关 eslint 与 jest 必须执行。
- 该方案已在 Code Loop Round 1 完成实现与验证；本文件保留设计摘要，并记录最终实现状态、验证结果与 review 修复记录。

# 技术方案

1. 收窄 `useTransformStyle` 的百分比收集职责。

   - 修改 `packages/webpack-plugin/lib/runtime/components/react/utils.tsx` 中 `visitOther` / `percentKeyPaths` 的收集逻辑，不再把 `fontSize` / `lineHeight` 加入通用 `percentKeyPaths`。
   - 仍保留现有 radius、gap、rowGap、columnGap、calc、env、css var / uno var 等流程，避免影响非文本继承相关百分比。
   - `resolvePercent` 可继续保留 `fontSize` / `lineHeight` 分支，供后置文本 helper 或 `calc()` 既有分支复用；但 `useTransformStyle` 主流程不再主动收集这两个 key 的普通百分比。
   - `calc(50%)` 这类文本属性里的百分比仍可能走现有 `calcKeyPaths`，本次不扩大到“延后解析 calc 内字体百分比”。若实现中发现 `fontSize: calc(...)` 存在同类继承问题，应记录为风险或后续工作，不在本次顺手重构 calc。

2. 调整 `transformFont`，保留可后置解析的文本值。

   - `transformFont(styleObj)` 仍解析 `font` 简写并删除原 `font` key，按“长属性不覆盖简写”的现有规则写入缺失的长属性。
   - 当简写中的 `font-size` 是百分比时，写入可后置解析的值，例如保留 `'50%'`，不要在 `transformFont` 内调用 `resolvePercent`。
   - 当简写中的 `line-height` 是百分比时，写入可后置解析的百分比字符串；当它是 unit-less 纯数字时，必须先规范化为百分比字符串中间态，例如 `1.5` -> `'150%'`，避免和 `global.__formatValue` 处理后的 RN 绝对 number 混淆；当它是明确长度单位时，仍按现有 `global.__formatValue` 转为 RN 可接受值。
   - `fontFamily`、`fontWeight`、`fontStyle`、`fontVariant` 等非百分比槽位继续在 `transformFont` 中处理。
   - RN 最终不能收到百分比字符串 `lineHeight`。因此后续 `resolveTextPercentStyle` 必须在落入最终 style / 子级透传前把 `lineHeight` 百分比解析成 number；若当前、继承和 props 都没有可用字体基数，使用 `16` 作为最终兜底，避免因缺少基数把合法百分比直接丢弃。

3. 新增一个集中处理文本百分比的非 Hook helper。

   建议形态：

   ```ts
   function resolveTextPercentStyle (
     textStyle?: TextStyle,
     parentTextStyle?: TextStyle
   ): TextStyle | undefined
   ```

   解析规则：

   - 只处理 `fontSize`、`lineHeight` 两类文本继承相关值；其它 style 原样保留。
   - 后置文本百分比的字号基数优先级统一为：解析后的当前 `fontSize` number -> `parentTextStyle?.fontSize` number -> `16`。其中 `16` 表示 RN number `16` / CSS 语义的 16px 基准。对于 `fontSize` 自身为百分比的场景，解析后的当前 `fontSize` 尚不可用，因此依次使用 inherited `fontSize`、`16`。
   - `fontSize` 为百分比时，按上述基数解析为 RN number；缺少 inherited `fontSize` 时使用 `16` 兜底，例如 `'50%'` -> `8`。
   - `lineHeight` 为百分比字符串时，按上述基数解析为 RN number；来自 `font` 简写的 unit-less line-height 已在 `transformFont` 中规范化为这类百分比字符串，例如 `'150%'`。
   - `lineHeight` 为 number 时视为已由 `global.__formatValue` 或上游流程得到的 RN 绝对数值，必须保持原 number，不按 CSS 倍数重新解析。
   - `fontSize` / `lineHeight` 值本身不是可识别百分比、长度或 RN number 等合法格式时，按现有风格 `warn` 并丢弃；但不要因为缺少字体基数丢弃合法百分比，最终应使用 `16` 兜底解析。
   - 只有确实需要改写 `fontSize` 或 `lineHeight` 时才 clone `textStyle`，避免无谓对象复制；可沿用 `extendObject({}, textStyle)`。
   - helper 不解析 css var、calc、env、font shorthand，不读取 context，不参与 Hook。

4. 在 `useTextPassThrough` 内后置解析并继续透传。

   - 保持 hook 签名集中在文本样式、文本属性和显式启用开关上：

     ```ts
     useTextPassThrough(textStyle, textProps, { enableTextPassThrough })
     ```

   - 订阅条件仍只使用现有 `shouldEnableTextPassThrough = enableTextPassThrough || !!textStyle || !!textProps`，并继续用 `useRef` 锁定首轮状态；不新增 `hasTextStyle(styleObj)`，不在 transform 前订阅 context。
   - 只有 `enableTextPassThroughRef.current` 为 true 时才调用 `useContext(TextPassThroughContext)`，保持非 text pass-through 场景不订阅。
   - 拿到 `parent` 后，先用 `resolveTextPercentStyle(textStyle, parent?.textStyle)` 得到 `resolvedTextStyle`，再按现有语义与 `parent.textStyle` 合并：

     ```ts
     const nextTextStyle = resolvedTextStyle
       ? extendObject({}, parent?.textStyle, resolvedTextStyle)
       : parent?.textStyle
     ```

   - `textProps` 合并逻辑保持现有行为；`TextPassThroughContextValue` 类型结构不变。
   - 当前组件没有 textStyle / textProps / enable 时仍直接返回 `null`，不订阅 context，也不会为了百分比解析额外做工作。

5. 删除/内联 `useTextPassThroughText` 的职责，由 `mpx-text.tsx` 直接编排 Text 消费端逻辑。

   - `useTextPassThroughText` 不再保留或扩展；`utils.tsx` 中该 helper 可移除，只保留/新增非 Hook `resolveTextPercentStyle` 供 `useTextPassThrough` 与 `mpx-text.tsx` 调用。
   - `mpx-text` 是 Text 消费端，本来就会读取 `TextPassThroughContext`。本次不在 `useTransformStyle(currentStyle)` 前新增通用 context helper，也不把当前 Text 自身完整的本地最终样式交给额外 hook。
   - `mpx-text` 调用顺序建议调整为：
     - 先 `useTransformStyle(currentStyle, { enableVar, parentWidth, parentHeight })`，此时 `normalStyle` 中可能保留 `fontSize: '50%'` / `lineHeight: '150%'`。
     - 直接读取 `TextPassThroughContext` 得到 `inheritedText`。
     - 调用 `resolveTextPercentStyle(normalStyle, inheritedText?.textStyle)` 得到 `resolvedNormalStyle`。纯文本子节点场景也必须执行这一步，当前 Text 自身的最终 style 不能残留未解析文本百分比。
     - 用 `resolvedNormalStyle` 与 `inheritedText.textStyle` 合成 `finalStyle`，而不是直接用未解析的 `normalStyle`。
     - 仅在非纯字符串子级场景中，从 `resolvedNormalStyle` 拆出 `childTextStyle`，再与 `inheritedText` 合成子级 `textPassThrough`；这样继续透传给后代的 text style 也不会携带未解析百分比。
   - `mpx-simple-text` 不走 `useTransformStyle`，本次不参与文本百分比解析。它可直接保留或内联原来的轻量 inherited text 合并逻辑：读取 context 后按现有语义合并继承文本信息与自身要透传的轻量样式/props，不为了复用而继续保留一个通用 `useTextPassThroughText` helper；若其 props.style 中未来需要百分比继承解析，可作为后续增强，不纳入本次最小修复。

6. 更新组件调用点，移除 `parent-font-size` 对文本百分比解析的依赖。

   - 主要改动不再是在每个组件增加 transform 前 helper，也不扩展 `useTextPassThrough` 的 option；已经调用 `useTextPassThrough` 的 RN 基础组件继续通过 text pass-through context 拿继承字号。
   - 需要核对的调用点包括：
     - `mpx-view.tsx`
     - `mpx-button.tsx`
     - `mpx-checkbox.tsx`
     - `mpx-radio.tsx`
     - `mpx-label.tsx`
     - `mpx-form.tsx`
     - `mpx-scroll-view.tsx`
     - `mpx-swiper.tsx`
     - `mpx-swiper-item.tsx`
     - `mpx-sticky-header.tsx`
     - `mpx-sticky-section.tsx`
     - `mpx-movable-view.tsx`
     - `mpx-picker-view/index.tsx`
   - `mpx-text.tsx` 改为直接读取 `TextPassThroughContext`，本地调用 `resolveTextPercentStyle(normalStyle, inheritedText?.textStyle)`，使用 `resolvedNormalStyle` 生成最终 style，并只在非纯字符串子级场景中从 `resolvedNormalStyle` 拆出 `childTextStyle` 生成子级透传。
   - `mpx-simple-text.tsx` 移除对通用 text helper 的依赖后，内联保留现有轻量继承合并语义；它不调用 `useTransformStyle`，本次不新增文本百分比解析职责。
   - 使用 `rg "useTextPassThrough\\(" packages/webpack-plugin/lib/runtime/components/react` 核对普通组件调用点是否有遗漏，并使用 `rg "useTextPassThroughText" packages/webpack-plugin/lib/runtime/components/react` 确认旧 helper、调用点和测试描述已清理；不要为了统一签名改动与本问题无关的组件逻辑。

7. 不把 inherited textStyle 放回 transform。

   - 禁止把 `parent.textStyle` 合并进 `styleObj`、`currentStyle`、`normalStyle` 后再调用 `useTransformStyle`。
   - 禁止对 inherited textStyle 做二次 CSS var / calc / font transform。
   - inherited textStyle 的职责限定为：
     - 给当前本地 `fontSize` / `lineHeight` 百分比提供 number 基数。
     - 与当前已解析的 textStyle 合并后继续向子树透传。

8. 文档与 Skill 同步策略。

   本次属于 RN 运行时样式行为修正，影响跨端输出 RN 的文本样式继承语义。Coder 执行时需要检查 `docs-vitepress/` 相关 RN 样式文档和 `.agents/skills/mpx2rn/references/` 中 RN 样式说明：

   - 若现有内容已说明“继承样式不二次转换”，但未说明“本地文本百分比延后到 text pass-through 阶段，以已转换继承 fontSize 作为基数”，补充一条最小说明。
   - 若已有同等语义，不重复堆文档，只在 Code Loop 执行记录中说明已核对无需变更的原因。
   - 涉及 `.agents/skills/mpx2rn/` 时，按仓库要求先读取并遵守该 Skill。

# 影响范围

- 主要影响 `packages/webpack-plugin/lib/runtime/components/react/utils.tsx`、已调用 `useTextPassThrough` 的 RN 基础组件、`mpx-text.tsx` 的最终 style 合成与子级透传编排，以及 `mpx-simple-text.tsx` 对旧 text helper 的移除/内联。
- `utils.tsx` 中 `useTextPassThroughText` 可移除；保留/新增非 Hook `resolveTextPercentStyle`，并继续保留普通组件使用的 `useTextPassThrough`。
- 行为影响集中在 text pass-through 已启用的场景：当前节点有 `textStyle`、有 `textProps`、或显式设置 `enable-text-pass-through`，且本地 text style 中存在 `fontSize` / `lineHeight` 百分比或 `font` 简写相关百分比。
- 非 text pass-through 场景、没有 textStyle / textProps / `enable-text-pass-through` 的组件不订阅 `TextPassThroughContext`，不新增 context 更新开销。
- `useTransformStyle` 不再把 `fontSize` / `lineHeight` 普通百分比当作通用 percent 处理，可能影响少量此前仅依赖 `parent-font-size` 且没有进入 text pass-through 的用法；该风险需要测试和文档说明锁定。
- 不改变 `TextPassThroughContextValue` 类型结构，不改变 pending text props 的合并语义。
- 可能触及 RN 文档与 mpx2rn Skill 的样式说明，但不涉及编译器 API、模板语法、CLI 参数等其它对外接口。

# 验证方案

新增或调整单元测试：

- 在 `packages/webpack-plugin/test/runtime/react-native/` 新增窄单测，例如 `text-percent-pass-through.spec.ts`；也可在现有 `transform-font.spec.ts` 中补充 `transformFont` 的局部用例。
- 覆盖核心用例：
  - `useTransformStyle({ fontSize: '50%', lineHeight: '150%' })` 不再立即解析两者；`normalStyle` 中保留可后置解析的值。
  - `useTransformStyle({ font: '50%/1.5 Arial' })` 展开出 `fontSize`、`lineHeight`、`fontFamily` 等长属性，其中 `fontSize` 百分比保留为百分比字符串，unit-less `lineHeight` 规范化为百分比字符串中间态，例如 `'150%'`。
  - `useTransformStyle({ font: '16px/1.5 Arial' })` 或等价 `transformFont` 路径中，`transformFont` 中间态 `lineHeight` 为 `'150%'`，后置 `resolveTextPercentStyle` 基于当前 `fontSize: 16` 解析为 `24`。
  - `useTextPassThrough(textStyle, textProps, { enableTextPassThrough })` 在已有条件式订阅拿到 `parent.textStyle.fontSize = 20` 后，将 `fontSize: '50%'` 解析为 `10`，将 `lineHeight: '150%'` 解析为 `15`。
  - `lineHeight` 百分比优先基于解析后的当前 `fontSize`；当前没有 `fontSize` 时基于 inherited `fontSize` 或最终兜底 `16`。
  - 无当前 `fontSize`、无 inherited `fontSize` 时，`fontSize: '50%'` 解析为 `8`，`lineHeight: '150%'` 解析为 `24`。
  - 无当前 `fontSize`、无 inherited `fontSize` 时，`font: '50%/1.5 Arial'` 通过后置解析得到 `fontSize: 8`、`lineHeight: 12`。
  - 已格式化的 `lineHeight: 24` 保持 `24`，不被当作 unit-less 倍数，也不基于 `fontSize` 重新解析。
  - `mpx-text` 纯文本子节点场景下，会在直接读取 `TextPassThroughContext` 得到 `inheritedText` 后，显式解析本地 `normalStyle` 中的 `fontSize` / `lineHeight` 百分比，并用解析后的 `resolvedNormalStyle` 与 inherited text 合成最终 `finalStyle`。
  - `mpx-text` 非纯字符串子级场景下，除本地 `normalStyle/finalStyle` 解析外，还要验证从 `resolvedNormalStyle` 拆出的 `childTextStyle` 再生成子级 `textPassThrough`，不会把未解析百分比继续传给后代。
  - `mpx-simple-text` 保持现有继承合并行为不回退：内联读取/合并 inherited text 后仍能向子级透传既有文本信息；该组件不走 `useTransformStyle`，本次测试不要求它参与文本百分比解析。
  - 无 text pass-through 时不订阅 context：`enableTextPassThrough` 为 false、`textStyle` 不存在、`textProps` 不存在时，`useTextPassThrough` 仍直接返回 `null`，不调用 `useContext(TextPassThroughContext)`。
  - RN 最终 style 不残留非法 `lineHeight` 百分比字符串；缺少字体基数时使用 `16` 兜底解析，只有值本身不是可识别百分比/长度等非法格式时才触发 `warn` 并丢弃。
  - 继承 textStyle 不进入 `useTransformStyle`：构造 inherited textStyle 带已转换值，确认不会被 css var / calc / font transform 二次处理。

需要执行的验证命令：

- 相关 eslint：
  - `npm exec eslint -- packages/webpack-plugin/lib/runtime/components/react/utils.tsx packages/webpack-plugin/lib/runtime/components/react/mpx-view.tsx packages/webpack-plugin/lib/runtime/components/react/mpx-button.tsx packages/webpack-plugin/lib/runtime/components/react/mpx-checkbox.tsx packages/webpack-plugin/lib/runtime/components/react/mpx-radio.tsx packages/webpack-plugin/lib/runtime/components/react/mpx-label.tsx packages/webpack-plugin/lib/runtime/components/react/mpx-form.tsx packages/webpack-plugin/lib/runtime/components/react/mpx-scroll-view.tsx packages/webpack-plugin/lib/runtime/components/react/mpx-swiper.tsx packages/webpack-plugin/lib/runtime/components/react/mpx-swiper-item.tsx packages/webpack-plugin/lib/runtime/components/react/mpx-sticky-header.tsx packages/webpack-plugin/lib/runtime/components/react/mpx-sticky-section.tsx packages/webpack-plugin/lib/runtime/components/react/mpx-movable-view.tsx packages/webpack-plugin/lib/runtime/components/react/mpx-picker-view/index.tsx packages/webpack-plugin/lib/runtime/components/react/mpx-text.tsx packages/webpack-plugin/lib/runtime/components/react/mpx-simple-text.tsx packages/webpack-plugin/test/runtime/react-native/text-percent-pass-through.spec.ts`
- 相关 jest：
  - `npm test -- --runInBand packages/webpack-plugin/test/runtime/react-native/text-percent-pass-through.spec.ts packages/webpack-plugin/test/runtime/react-native/transform-font.spec.ts`
- 若同步修改了 docs 或 Skill，再对修改的 markdown 执行仓库相关 lint；若仓库没有单独 markdown lint，需在 Code Loop 执行记录中说明未运行原因。

按仓库约束，若单元测试失败，Coder 最多尝试 2 次修复；仍失败则停止并记录错误与分析。

# 风险与回滚

- 风险：`useTransformStyle` 不再解析 `fontSize` / `lineHeight` 百分比后，未进入 text pass-through 的历史用法可能不再得到原先基于 `parent-font-size` 的解析结果。计划接受这个集中化取舍，但测试需锁定非 text pass-through 不订阅 context；如需保持旧行为，必须重新评估是否会回到前置判断方案。
- 风险：`lineHeight` 从 `font` 简写中保留为百分比字符串中间态后，后置解析若遗漏某条最终 style 路径，会把 RN 不接受的字符串传下去。测试必须覆盖 `mpx-text` finalStyle、普通组件 text pass-through、子级透传三条路径。
- 风险：若实现中把 `global.__formatValue` 处理后的 `lineHeight` number 当成 CSS unit-less 倍数，会把 RN 绝对数值错误放大。本方案要求 unit-less line-height 只以百分比字符串中间态表达，number 一律按 RN 绝对数值保留。
- 风险：当当前、继承和 props 都没有字体基数时，合法百分比会按 CSS 常见默认字号 `16px` 语义解析。该行为是本轮显式约束，可能与少量历史“缺基数即丢弃”的实现预期不同，需要用新增测试锁定。
- 风险：`fontSize: calc(...)` 内部百分比仍在 `calc` 流程中按现有 `resolvePercent` 处理，暂不具备 inherited text 延后解析能力。本次只解决普通百分比和 `font` 简写百分比，避免扩大改动。
- 风险：若实现时把 `useContext(TextPassThroughContext)` 移到普通非 text pass-through 组件的 `useTransformStyle` 前或新增无条件订阅，会违背用户明确的性能约束。本方案要求普通组件 context 读取仍留在现有 `useTextPassThrough` 路径内；`mpx-text.tsx` / `mpx-simple-text.tsx` 作为文本消费端可直接读取 context，但不要抽回通用 helper 扩大调用面。
- 风险：组件调用点遗漏会导致同类基础组件行为不一致。实现时应以 `rg "useTextPassThrough\\("` 核对普通组件调用点，并以 `rg "useTextPassThroughText"` 确认旧 helper 已从运行时代码和测试描述中清理。
- 回滚方式：恢复 `visitOther` 中 `fontSize` / `lineHeight` 加入 `percentKeyPaths` 的逻辑，恢复 `transformFont` 中即时解析/丢弃 lineHeight 的旧行为，移除 `resolveTextPercentStyle` 与 hook 签名扩展，恢复 `mpx-text.tsx` / `mpx-simple-text.tsx` 使用旧 text helper 的实现，并删除新增测试 / 文档说明。该回滚不涉及数据迁移。

# Plan Loop 修订记录

- Round 1：初版计划。无上一轮 reviewer finding。确定采用“transform 前只读取继承 fontSize 基数，不合并继承 textStyle 进入 transform”的小改动方案；列出目标组件、文档/Skill 同步策略、eslint 与 jest 验证命令。
- Round 2：用户拒绝上一版计划并指出“无条件 `useContext(TextPassThroughContext)` 会让全量基础组件订阅 context，增加更新性能开销”。接受该 finding：删除无条件订阅方案，改为按 `enableTextPassThrough || !!textProps || hasTextStyle(styleObj)` 计算订阅需求，使用 `useRef` 锁定生命周期内启用状态，仅在 ref 为 true 时条件式读取 `TextPassThroughContext`；补充“不需要文本透传时不调用 useContext / 不订阅 context”的核心测试要求。
- Round 3：用户指出 Round 2 仍然需要 transform 前置 `hasTextStyle` 判断和额外 helper，方案不够集中，并建议不要在 `useTransformStyle` 中解析 `fontSize` / `lineHeight` 百分比，而是保留到 `useTextPassThrough` 或之后拿到完整信息再解析。接受该 finding：技术方案转向“延后解析文本百分比”，移除 transform 前订阅 helper 方向；`useTransformStyle` 不再收集 `fontSize` / `lineHeight` 普通百分比，`transformFont` 保留可后置解析的 `fontSize` / `lineHeight` 值，由 `resolveTextPercentStyle` 在 `useTextPassThrough` / text 消费端基于 inherited text 和默认 `16` 解析；同时保留“不扩大 TextPassThroughContext 订阅面”的约束。
- Round 4：用户补充约束“line-Height 为纯数字时必须转换为百分比，否则会和 `global.__formatValue` 处理过后的纯数字产生混淆”。接受该约束：计划明确 `font` 简写中的 unit-less line-height 必须在 `transformFont` 中规范化为百分比字符串中间态，例如 `1.5` -> `'150%'`，再由后置 `resolveTextPercentStyle` 按当前或继承 `fontSize` 解析；同时明确 `global.__formatValue` 后得到的 `lineHeight` number 是 RN 绝对数值，不能当倍数。验证方案新增 `font: '16px/1.5 Arial'` 中间态 `'150%'` 后置解析为 `24`，以及已格式化 `lineHeight: 24` 保持不变的用例。
- Round 5：用户补充约束“如果最终还是无法拿到 `font-size` 或 `parent-font-size`，以 16px 作为兜底”。接受该约束并在最终实现中收窄为当前 `fontSize` number -> inherited `textStyle.fontSize` number -> `16`；`parent-font-size` 不再作为运行时解析参数。验证方案新增无任何字体基数时 `fontSize: '50%'` -> `8`、`lineHeight: '150%'` -> `24`、`font: '50%/1.5 Arial'` -> `fontSize: 8` / `lineHeight: 12`。
- Round 6：用户同意收窄上一轮关于当前 Text 本地样式塞入 hook 的设计。接受该调整：`useTextPassThroughText` 只负责 inherited text 读取与子级 text pass-through；`mpx-text.tsx` 在拿到 `inheritedText` 后显式调用 `resolveTextPercentStyle(normalStyle, inheritedText?.textStyle)` 生成 `resolvedNormalStyle` 并合成 `finalStyle`。同时补充纯文本子节点时 `childTextStyle` 可以是 `undefined`，但 `normalStyle` 仍必须解析后进入 `finalStyle`；验证方案拆分纯文本 finalStyle 与非纯字符串子级透传两类用例。
- Round 7：用户进一步指出 `useTextPassThroughText` helper 已无保留必要，逻辑全部拆到 `mpx-text.tsx` 更方便编排。接受该方向：计划不再要求保留或扩展该 helper，改为在 `mpx-text.tsx` 直接读取 `TextPassThroughContext`，按 inherited text -> `resolveTextPercentStyle(normalStyle, inheritedText?.textStyle)` -> `finalStyle` -> 非纯字符串子级从 `resolvedNormalStyle` 拆出 `childTextStyle` 并生成子级 `textPassThrough` 的顺序完成编排；`mpx-simple-text.tsx` 内联保留现有轻量继承合并语义，不参与本次文本百分比解析；影响范围、验证方案和 grep 核对项同步改为移除旧 helper。

# Code Loop 执行记录

## Round 1 / coder-1（2026-07-02）

### 最终实现形态

- `useTransformStyle` 不再把普通 `fontSize` / `lineHeight` 百分比加入通用 `percentKeyPaths`，相关文本百分比延后到 text pass-through 阶段解析。
- `transformFont` 继续展开 `font` 简写，但保留 `fontSize` 百分比；`font` 简写中的 unit-less `line-height` 统一规范化为百分比字符串中间态，例如 `1.5` -> `150%`，避免和 RN 绝对 number 混淆。
- 新增非 Hook helper `resolveTextPercentStyle(textStyle, parentTextStyle)`，只解析 `fontSize` / `lineHeight`，基数优先级为当前已解析 `fontSize` -> inherited `textStyle.fontSize` -> `16`。
- `useTextPassThrough` 保持 `enableTextPassThrough` option，不扩展 `parentFontSize`；保持 `enableTextPassThrough || !!textStyle || !!textProps` 的既有按需订阅边界，只在 text pass-through 已启用时读取 `TextPassThroughContext` 并解析本地 textStyle。
- `mpx-text.tsx` 直接读取 `TextPassThroughContext`，在 `useTransformStyle` 后解析 `normalStyle`，使用 `resolvedNormalStyle` 合成最终 `Text` style，并仅在非纯字符串子级场景中从解析后的样式生成子级 text pass-through。
- `mpx-simple-text.tsx` 内联保留原轻量继承合并/透传语义，不新增百分比解析职责；普通基础组件调用 `useTextPassThrough` 时保持原有 option 结构，不再传入 `parentFontSize`。
- 新增 `packages/webpack-plugin/test/runtime/react-native/text-percent-pass-through.spec.ts`，并更新 `transform-font.spec.ts` 的 `font` 简写百分比中间态断言。
- 已同步 RN 样式文档和 Mpx2RN 样式知识库：`docs-vitepress/guide/rn/style.md`、`.agents/skills/mpx2rn/references/rn-style-reference.md`、`.agents/skills/mpx2rn/references/rn-style-practice.md`。

### 关键验证结果

- `NODE_PATH=packages/webpack-plugin/node_modules npm test -- --runInBand packages/webpack-plugin/test/runtime/react-native/text-percent-pass-through.spec.ts packages/webpack-plugin/test/runtime/react-native/transform-font.spec.ts`：通过，`2 passed, 23 tests passed`。
- `npm exec eslint -- ...` 覆盖本次变更的 RN runtime/test 文件：通过。
- `git diff --check`：通过。
- 根 `package.json` 未提供独立 markdown lint 脚本，markdown 改动已通过 diff 内容核对。
- 备注：Jest 首次沙箱运行受 watchman 权限影响，提权后又因根 `node_modules` 缺少 `@babel/plugin-transform-react-jsx` 失败；内部 npm 源安装返回 `502 Bad Gateway`。最终使用已存在于 `packages/webpack-plugin/node_modules` 的依赖，通过 `NODE_PATH=packages/webpack-plugin/node_modules` 完成验证。

## Round 2 / coder-2（2026-07-02）

### Code Review Finding 处理

- C1：接受。该 solution 文件此前仍写着“只做方案设计”和“等待进入 Code Loop”，与 Round 1 已完成的 runtime、test、docs、Skill 实现相矛盾。

### 本轮修复

- 将本文件更新为已交付解决方案记录，保留设计摘要，同时补充最终实现形态、关键验证结果和 C1 修复记录。
- 本轮仅修改 workflow/solution markdown artifact，不修改运行时代码、测试、docs 或 Skill 内容。

### 本轮验证

- `git diff --check`：通过。
