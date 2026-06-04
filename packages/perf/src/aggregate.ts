import type { PerfEvent, AggResult } from './types'

/**
 * 按事件名聚合 measure 事件，给出 count / sum / avg / max 四项指标。
 *
 * - 仅统计 type === 'measure' 的事件，mark 事件被跳过（mark 单独无时长）。
 * - 纯函数，无副作用；console reporter 与业务自定义 reporter 共享同一份计算逻辑，
 *   避免「console 看到的数 vs APM 上报的数」对不上。
 */
export function aggregateByName (events: PerfEvent[]): Map<string, AggResult> {
  const agg = new Map<string, AggResult>()
  for (let i = 0; i < events.length; i++) {
    const e = events[i]
    if (e.type !== 'measure') continue
    let s = agg.get(e.name)
    if (!s) {
      s = { count: 0, sum: 0, avg: 0, max: 0 }
      agg.set(e.name, s)
    }
    s.count++
    s.sum += e.dur
    if (e.dur > s.max) s.max = e.dur
  }
  // 最后一次性回填 avg，避免循环里反复算除法
  for (const s of agg.values()) {
    s.avg = s.count ? s.sum / s.count : 0
  }
  return agg
}
