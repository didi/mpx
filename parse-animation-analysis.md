# parseAnimation.js 代码分析

> 分析时间: 2026-03-05

## 文件路径

`packages/core/src/platform/builtInMixins/parseAnimation.js`

## 功能概述

- `parseStyleTransition`: 输入 CSS 标准的 transition 规范，输出 react-native-reanimated 支持的 transition
- `parseStyleAnimation`: 输入 CSS 标准的 animation 规范，输出 react-native-reanimated 支持的 animation

## 整体评价

代码结构清晰，功能划分合理，支持了 CSS transition/animation 的主要属性。但存在一些潜在问题和优化空间。

---

## 潜在问题

### 1. animation-name 与关键词冲突

```javascript
// 如果用户定义了一个名为 "normal" 或 "infinite" 的动画名，会被错误识别
animation: myAnimation 1s normal  // normal 会被当作 animation-direction
animation: infinite 1s ease       // infinite 会被当作 animation-iteration-count
```

**建议**：CSS 规范允许使用引号包裹的 `<custom-ident>`，可以考虑支持 `"normal"` 这种写法来区分。

### 2. transition-property 的 `all` 值

CSS 中 `transition: all 0.3s` 是合法的，但代码中直接转驼峰处理：

```javascript
// 第 63-65 行
if (prop === 'transitionProperty') {
  v = dash2hump(v)  // 'all' 会保持 'all'，没问题
}
```

这里没问题，但如果用户写 `transition-property: all`，`dash2hump('all')` 会返回 `'all'`。需要确认 react-native-reanimated 是否支持 `'all'`。

### 3. parseValues 的边界情况

```javascript
// 第 232 行，如果传入 null/undefined 会报错
function parseValues(str, char = ' ') {
  // str 为 null/undefined 时，for...of 会报错
}
```

**建议**：添加空值检查。

### 4. 子属性值的重复格式化

```javascript
// 第 59-61 行
if (TIMING_FUNCTIONS_EXP.test(v)) {
  v = formatTimingFunction(v)
}
```

但 `parseSingleTransition/Animation` 已经做过格式化，如果同时存在简写和子属性，子属性的 timing function 可能被重复格式化（虽然 `formatTimingFunction` 内部会处理，但会有额外开销）。

### 5. 时间值顺序的歧义

CSS 规范中 duration 必须在 delay 之前，但代码仅按出现顺序处理：

```javascript
// 第 153-159 行
if (timeValues.length >= 1) {
  result.animationDuration = timeValues[0]
}
```

这是正确的，符合 CSS 规范。

---

## 优化建议

### 1. 提取重复代码

`parseSingleAnimation` 和 `parseSingleTransition` 有很多重复逻辑，可以提取公共部分：

```javascript
function parseCommonTiming(str, result) {
  const values = parseValues(str, ' ')
  const timeValues = []

  for (const val of values) {
    if (isTimingFunction(val)) {
      result.timingFunction = formatTimingIfNeeded(val)
      continue
    }
    if (isTime(val)) {
      timeValues.push(val)
      continue
    }
  }

  if (timeValues.length >= 1) result.duration = timeValues[0]
  if (timeValues.length >= 2) result.delay = timeValues[1]

  return { values, timeValues }
}
```

### 2. 增加输入校验

```javascript
function parseValues(str, char = ' ') {
  if (!isString(str) || !str.trim()) return []
  // ... 原有逻辑
}
```

### 3. 考虑 CSS 变量支持

如果需要支持 `var(--my-duration)` 这种 CSS 变量，当前代码无法正确解析。可以增加检测：

```javascript
function isCSSVariable(val) {
  return val.startsWith('var(')
}
```

### 4. 格式化后缓存的 timing function 对象

`cubicBezier()` 等返回的是对象，每次调用都会创建新实例。如果有大量相同参数的 timing function，可以考虑缓存。

---

## 总结

| 方面 | 评价 |
|------|------|
| CSS 规范覆盖 | 较完善，覆盖了主要属性 |
| 边界处理 | 部分缺失（空值、特殊关键词冲突） |
| 错误提示 | 有基本的错误抛出 |
| 代码复用 | 有改进空间（两个 parse 函数重复较多） |
| 性能 | 可接受，如有大量调用可考虑缓存 |
