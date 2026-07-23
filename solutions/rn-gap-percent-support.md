# Mpx2RN 支持 `gap` / `row-gap` / `column-gap` 百分比

## 背景

RN 原生 `gap` / `rowGap` / `columnGap` 在类型层（[StyleSheetTypes.d.ts:68](../packages/webpack-plugin/node_modules/react-native/Libraries/StyleSheet/StyleSheetTypes.d.ts#L68)）和实现层都只接受 `number`，不支持 `%` 字符串。Mpx2RN 输出链路中，编译期 `style-helper.js` 与运行时 `__getStyle` 的 `formatValue` 都只把 px/rpx/vw/vh 转 number，`%` 原样保留；而 `useTransformStyle` 内 `visitOther` 的百分比收集闸门只放行 `radiusPercent` 与 `fontSize / lineHeight`，gap 类百分比被静默丢弃，最终交给 RN 的 `rowGap` / `columnGap` 是 `'50%'` 字符串，RN 报错或不渲染。

目标：用户写 `gap: 50%`、`rowGap: 50%`、`columnGap: 50%`（含 `gap: 10px 50%` 这种混合值）时，运行时按 CSS 规范把 `%` 解析为 number — rowGap 基 parentHeight、columnGap 基 parentWidth；gap shorthand 拆分后两槽位各取对应基。

## 方案

### 复用现有能力

- [`resolvePercent`](../packages/webpack-plugin/lib/runtime/components/react/utils.tsx#L561)：按 key 查 `parentHeightPercentRule` / `selfPercentRule`，命中即取对应 parent\* 作 base；未命中走默认 parentWidth。
- [`transformPercent`](../packages/webpack-plugin/lib/runtime/components/react/utils.tsx#L589)：按收集到的 keyPath 列表批量调 `resolvePercent`。
- [`transformShorthand`](../packages/webpack-plugin/lib/runtime/components/react/utils.tsx#L1016)：在它写回 `rowGap` / `columnGap` 时就地解析 `%`，无需额外扫描或后置 pass。

### 实施

1. **长属性走主流程**
   - `parentHeightPercentRule` 加入 `rowGap: true`；`columnGap` 不加，落 `resolvePercent` 默认 parentWidth 分支。
   - `visitOther` 百分比闸门追加 `needGapPercent = key === 'rowGap' || key === 'columnGap'`，命中则 push 到 `percentKeyPaths`。
   - `rowGap: '50%'` / `columnGap: '50%'` 长属性由 `transformPercent` 在 `transformShorthand` 之前已落成 number。

2. **简写在 `transformShorthand` 写回阶段就地解析**
   - `transformShorthand` 签名追加**必传** `percentConfig: PercentConfig`，由 [调用侧](../packages/webpack-plugin/lib/runtime/components/react/utils.tsx#L1386) `useTransformStyle` 透传（`PercentConfig` 各字段本身可选，调用侧总能构造）。
   - 在 shorthand 展开后的写回循环里，若写入 prop 是 `rowGap` / `columnGap` 且值是含 `%` 的字符串，就地 `resolvePercent(val, prop, percentConfig)` 再赋值；其他 prop 保持原写入路径。
   - 这样 `gap: 50%` 展开成 `{rowGap: 50%, columnGap: 50%}` 时，两槽位各自经 `resolvePercent` 自动按各自的 base 落成 number；`gap: 10px 50%` 同样按位解析。

3. **不动编译期**
   - 编译期 `verifyValues` 对 `length` 类型（gap 命中此分支，[wx/index.js:106](../packages/webpack-plugin/lib/platform/style/wx/index.js#L106)）已经允许 `%`，运行时承接即可。
   - 编译期 `formatValue` 不识别 `%`，`%` 串原样进入 classMap / inline，由运行时统一解析，与 `top: 50%` / `width: 50%` 一致。

### 不需要的改动

- 不引入顶层 `hasGapShorthand` 标志位 — 写回阶段就地判断 prop + 值形态即可，逻辑紧贴展开点。
- 不重新跑 `transformPercent` 后置 pass — 复用同一 `resolvePercent` 即可。
- `transformShorthand` 不为 `percentConfig` 加可选兜底：生产链路总是经 `useTransformStyle` 注入，签名上保持必传更直白；测试若需绕过百分比解析可传空对象（`PercentConfig` 字段本身均可选）。

## 关键改动文件

- [packages/webpack-plugin/lib/runtime/components/react/utils.tsx](../packages/webpack-plugin/lib/runtime/components/react/utils.tsx)
  - `parentHeightPercentRule` 增加 `rowGap`
  - `visitOther` 百分比闸门扩展 `needGapPercent`
  - `transformShorthand` 签名追加必传 `percentConfig: PercentConfig`，写回循环对 `rowGap` / `columnGap` 百分比就地 `resolvePercent`
  - 调用侧 `useTransformStyle` 把 `percentConfig` 传入 `transformShorthand`
  - 同步 `runtimeAbbreviationMap.gap` 与 `runtimeForceExpandCompositeMap` 上的 gap 注释
- [packages/webpack-plugin/test/runtime/react-native/transform-shorthand.spec.ts](../packages/webpack-plugin/test/runtime/react-native/transform-shorthand.spec.ts)
  - `run` helper 接收 `percentConfig`（默认空对象，`PercentConfig` 字段均可选）
  - `gap shorthand` describe 增加单值/混合值 percent 用例，以及 base 缺失时 `resolvePercent` 原样返回的兜底用例
- [packages/webpack-plugin/test/runtime/react-native/use-transform-style-gap-percent.spec.ts](../packages/webpack-plugin/test/runtime/react-native/use-transform-style-gap-percent.spec.ts)（新增）
  - 覆盖长属性 `rowGap` / `columnGap` percent 经 `useTransformStyle` 主流程
  - 覆盖 `gap` 简写经 `useTransformStyle` 全链路

## 验证

```
npx jest packages/webpack-plugin/test/runtime/react-native/ \
         packages/webpack-plugin/test/platform/wx/style/
```

预期：现有 127 个用例 + 5 个新增用例全部通过（共 132 个）。
