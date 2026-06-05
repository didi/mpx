import { bus } from './bus'
import type { Reporter } from './types'

// 优先 performance.now（DOM / RN web）→ Hermes nativePerformanceNow → Date.now 兜底。
// Hermes 的 nativePerformanceNow 是 globalThis 上的专有 API，标准 lib.dom 类型里没有，
// 用窄类型断言把它声明出来——避免使用 ts-ignore 注释（ban-ts-comment 规则会拦截）。
const now: () => number = (() => {
  if (typeof performance !== 'undefined' && typeof performance.now === 'function') {
    return () => performance.now()
  }
  const g = (typeof globalThis !== 'undefined' ? globalThis : undefined) as
    | { nativePerformanceNow?: () => number }
    | undefined
  if (g && typeof g.nativePerformanceNow === 'function') {
    const native = g.nativePerformanceNow
    return () => native()
  }
  return () => Date.now()
})()

// 跨作用域的起止配对靠 mark name 匹配；同步代码内首选用 scope。
const marks = new Map<string, number>()

export function mark (name: string, meta?: object) {
  const ts = now()
  marks.set(name, ts)
  bus.push({ type: 'mark', name, ts, meta })
}

export function measure (name: string, start: string) {
  const s = marks.get(start)
  if (s === undefined) return
  const dur = now() - s
  bus.push({ type: 'measure', name, dur, start: s })
  // 用过即清，避免同名 mark 残留导致下一轮 measure 误命中旧时间戳。
  marks.delete(start)
}

export function scope (name: string, meta?: object) {
  const s = now()
  return () => {
    bus.push({ type: 'measure', name, dur: now() - s, start: s, meta })
  }
}

// 录制窗口控制
export const start = () => bus.start()
export const end = () => bus.end()

// reporter 注册 API
export const setReporter = (r: Reporter) => bus.setReporter(r)
export const clearReporter = () => bus.setReporter(undefined)
