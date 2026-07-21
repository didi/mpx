// Module-load-time globals consumed by lib/runtime/components/react/utils.tsx
// and @mpxjs/utils/src/env.js. Both reference the bare identifier `__mpx_mode__`
// so we mirror it onto `global` (which Node treats as the global object).
// Runs via jest's `setupFiles` before any spec import, guaranteeing visibility
// even though babel hoists ES module imports.
global.__mpx_mode__ = 'ios'
// @mpxjs/utils 的 log.js / object.js / path.js 在 runtime 下由 Mpx 注入 mpxGlobal；
// jest 环境没有 Mpx runtime，给最小 stub 让 warn/error 调用不抛 ReferenceError。
global.mpxGlobal = global
// 单测里把 warn/error 静默掉，避免污染 jest 输出；想观察行为时直接读 jest.spyOn 即可
global.__mpx = { config: { ignoreWarning: true, errorHandler: () => {} } }
// mimic the production formatValue (styleHelperMixin.ios.js) against a fixed
// 375x667 screen so unit换算在单测里是确定值：
//   rpx → value * 375 / 750  (即 /2)
//   vw  → value * 375 / 100
//   vh  → value * 667 / 100
//   px / 无单位 → number；% 及其它原样保留
const __SCREEN = { width: 375, height: 667 }
const __unit = {
  rpx: (v) => v * __SCREEN.width / 750,
  vw: (v) => v * __SCREEN.width / 100,
  vh: (v) => v * __SCREEN.height / 100
}
global.__formatValue = function (v, unitType) {
  // 编译期 _f(40, 'rpx') 形态：第二参数显式带单位
  if (unitType && typeof __unit[unitType] === 'function') return __unit[unitType](Number(v))
  if (typeof v !== 'string') return v
  const m = /^(-?\d+(?:\.\d+)?)(rpx|px|vw|vh|%)?$/.exec(v.trim())
  if (!m) return v
  if (!m[2] || m[2] === 'px') return Number(m[1])
  if (typeof __unit[m[2]] === 'function') return __unit[m[2]](Number(m[1]))
  return v
}
