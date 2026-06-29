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
global.__formatValue = function (v) {
  if (typeof v !== 'string') return v
  // mimic the production formatValue subset that transformShorthand-related
  // tests care about: numeric strings → numbers, leave the rest as-is.
  const m = /^(-?\d+(?:\.\d+)?)(rpx|px|vw|vh|%)?$/.exec(v.trim())
  if (m && (!m[2] || m[2] === 'px')) return Number(m[1])
  return v
}
