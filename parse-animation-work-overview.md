### 已完成的工作概览

- **阅读并执行 `solutions/parse-animation.md` 要求**：按文档要求在 `parseAnimation.js` 中完善解析逻辑，并补充单测，且已通过 Jest 测试。

### 具体实现

- **完善 `parseAnimation.js` 功能**（文件：`packages/core/src/platform/builtInMixins/parseAnimation.js`）  
  - 实现 `formatTimingFunction`，支持并转换：
    - `cubic-bezier(x1, y1, x2, y2)` → 使用 Reanimated 的 `cubicBezier`。
    - `steps(stepsNumber, modifier?)` → 使用 Reanimated 的 `steps`。
    - `linear(...)` → 使用 Reanimated 的 `linear`，支持简单的 `number` 与 `"number percent"` 组合。
  - 新增 `TIMING_FUNCTIONS_EXP` 正则，仅匹配带参数形式的 timing-function（`cubic-bezier(...) / steps(...) / linear(...)`）。
  - 在以下两处统一对 timing-function 做转换：
    - `parseSingleAnimation`：遇到 timing-function 时，若是参数形式则通过 `formatTimingFunction` 转为 Reanimated 对象；否则保留普通字符串（如 `'ease'`、`'linear'`）。
    - `parseSingleTransition`：同样处理 `transitionTimingFunction`。
  - 补齐/修正细节：
    - 修正 `parseSingleAnimation` 中错误的报错文案引用（`result['animation-name']` → `result.animationName`）。
    - 保持原有逻辑：以 `animationName` / `transitionProperty` 数组长度为基准，对其他子属性做补齐（用最后一个值填充）或截断，并将单元素数组压扁成单值。

- **运行时代码与测试依赖的拆分**  
  - 运行时代码中保持对 `react-native-reanimated` 的直接依赖：`import { steps, linear, cubicBezier } from 'react-native-reanimated'`，不再做运行时降级或兜底实现。
  - 在单测环境中，通过 `packages/core/__mocks__/react-native-reanimated.js` 提供同名函数的 mock（返回带 `name`、`args`、`normalize()`、`toString()` 的对象），以便验证 `formatTimingFunction` 的行为而无需真实 Reanimated 依赖。

- **新增 Jest 单测**（文件：`packages/core/__tests__/platform/parseAnimation.spec.js`）  
  - 基础环境准备：
    - 设置 `global.__mpx_mode__ = 'ios'` 以满足 `@mpxjs/utils` 对运行时 mode 的依赖。
    - 使用 CommonJS `require` 引入 `parseStyleAnimation` / `parseStyleTransition`，符合当前 Jest 配置。
  - 覆盖场景包括：
    - Transition 简写 + 子属性合并（多属性、`transitionTimingFunction` 合并）。
    - Transition 中 `steps()` / `linear()` timing-function 的解析。
    - Animation 简写解析（包含 duration、delay、timing-function、name）。
    - 多 animation 与 `animationDelay` 等子属性合并。
    - 简写中使用 `cubic-bezier` / `steps` / `linear`，验证它们都被转换为带 `normalize()` 的对象。
    - s / ms 混合时间单位的解析。

- **测试结果**  
  - 使用 `npm test -- packages/core/__tests__/platform/parseAnimation.spec.js` 或 `npx jest --passWithNoTests packages/core/__tests__/platform/parseAnimation.spec.js --no-watchman` 运行，6 个测试用例全部通过。

