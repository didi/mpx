'use strict'

// 当前已知分组列表，未来新增分组扩这个数组 + 同步加 declare 即可。
// @mpxjs/perf 包零感知分组——分组逻辑只存在于 webpack-plugin 这一侧。
const PERF_GROUPS = ['framework', 'user']

/**
 * 把用户配置 { enable, probes } 归一化成「总开关 + 各分组开关」。
 *
 * 输出形如：
 *   { enable: true, framework: true, user: false }
 *
 * - `enable: false` 或不传 perf → 全关。
 * - `enable: true && probes: []` → 等价于 enable: false（没有分组要开就视为关闭）。
 * - probes 中出现未知分组名 → 抛错（避免 typo 静默失效）。
 */
function normalizePerfOptions (raw) {
  if (!raw || raw.enable !== true) {
    const off = { enable: false }
    for (let i = 0; i < PERF_GROUPS.length; i++) off[PERF_GROUPS[i]] = false
    return off
  }
  const probes = Array.isArray(raw.probes) ? raw.probes : []
  for (let i = 0; i < probes.length; i++) {
    if (PERF_GROUPS.indexOf(probes[i]) === -1) {
      throw new Error(
        `[mpx perf] unknown probe "${probes[i]}"; known probes: ${PERF_GROUPS.join(', ')}`
      )
    }
  }
  const result = {}
  let anyOn = false
  for (let i = 0; i < PERF_GROUPS.length; i++) {
    const k = PERF_GROUPS[i]
    const on = probes.indexOf(k) !== -1
    result[k] = on
    if (on) anyOn = true
  }
  // 派生总开关：任一分组打开 → enable 才真正有效。
  result.enable = anyOn
  return result
}

module.exports = {
  PERF_GROUPS,
  normalizePerfOptions
}
