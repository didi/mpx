import { bus } from './bus'
import type { PerfStartOptions, Reporter } from './types'

// 优先 performance.now（DOM / RN web）→ Hermes nativePerformanceNow → Date.now 兜底。
// Hermes 的 nativePerformanceNow 是 globalThis 上的专有 API，标准 lib.dom 类型里没有,
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

// name 模式通过名称配对；同名 start 后一次覆盖前一次。
const namedAggrStarts = new Map<string, number>()

// aggr id 模式用平行数组持有进行中的区段，避免每次 start 分配闭包对象。
// aggrNames / aggrStarts 同步增长；aggrFreeList 回收已结束的槽位 id。
// 不依赖严格栈序（freeList 处理乱序结束与提前 end）；React render 实际就是栈式，
// freeList 池稳态后槽位数 == 最大并发深度，不再增长。
const aggrNames: (string | null)[] = []
const aggrStarts: number[] = []
const aggrFreeList: number[] = []
let aggrTop = 0

/**
 * 起一段聚合统计，默认返回 id 句柄；useName 为 true 时改用 name 配对。
 * 录制态下也仅做：状态判断、freeList/aggrTop 取 id、一次 now()、两次数组下标写。
 * 全程无对象 / 闭包分配——这是高频 render 场景的核心优化。
 */
export function aggrStart (name: string, useName?: false): number
export function aggrStart (name: string, useName: true): void
export function aggrStart (name: string, useName: boolean): number | void
export function aggrStart (name: string, useName = false): number | void {
  if (useName) {
    namedAggrStarts.set(name, now())
    return
  }
  if (!bus.isRecording()) return -1
  const id = aggrFreeList.length > 0 ? aggrFreeList.pop()! : aggrTop++
  aggrNames[id] = name
  aggrStarts[id] = now()
  return id
}

/**
 * 关闭 id 或 name 对应的聚合区段，把时长累加进同名桶。
 */
export function aggrEnd (target: number | string): void {
  if (typeof target === 'string') {
    const startedAt = namedAggrStarts.get(target)
    if (startedAt === undefined) return
    namedAggrStarts.delete(target)
    bus.pushAggr(target, now() - startedAt)
    return
  }
  if (target < 0) return
  const name = aggrNames[target]
  if (name == null) return
  const dur = now() - aggrStarts[target]
  // 清 name 表示该槽空闲，避免重复 end 重复累加；id 回收进 freeList。
  aggrNames[target] = null
  aggrFreeList.push(target)
  bus.pushAggr(name, dur)
}

/**
 * 向当前录制窗口追加一条有序时间线事件；未录制时不读取时钟。
 */
export function mark (name: string, info?: unknown) {
  if (!bus.isRecording()) return
  bus.pushMark(name, now, info)
}

/**
 * 起一段区段序列，默认返回 id 句柄；useName 为 true 时改用 name 配对。
 */
let nextTraceId = 0
const traceIdToEvent = new Map<number, number>()
const traceNameToEvent = new Map<string, number>()

export function traceStart (name: string, useName?: false): number
export function traceStart (name: string, useName: true): void
export function traceStart (name: string, useName: boolean): number | void
export function traceStart (name: string, useName = false): number | void {
  if (!bus.isRecording()) {
    if (!useName) return -1
    return
  }
  const eventIndex = bus.reserveTrace(name, now)
  if (eventIndex < 0) {
    if (!useName) return -1
    return
  }
  if (useName) {
    traceNameToEvent.set(name, eventIndex)
    return
  }
  const id = nextTraceId++
  traceIdToEvent.set(id, eventIndex)
  return id
}

/**
 * 结束 id 或 name 对应的 trace，回填 duration 与可选 info。
 */
export function traceEnd (target: number | string, info?: unknown): void {
  if (!bus.isRecording()) return
  const eventIndex = typeof target === 'string'
    ? traceNameToEvent.get(target)
    : traceIdToEvent.get(target)
  if (eventIndex === undefined) return
  if (typeof target === 'string') {
    traceNameToEvent.delete(target)
  } else {
    traceIdToEvent.delete(target)
  }
  bus.finishTrace(eventIndex, now(), info)
}

// 旧聚类 API 保持原签名，只复用 aggr 实现。
export function scopeStart (name: string): number {
  return aggrStart(name)
}

export function scopeEnd (id: number): void {
  aggrEnd(id)
}

export function measureStart (name: string): void {
  aggrStart(name, true)
}

export function measureEnd (name: string): void {
  aggrEnd(name)
}

// 录制窗口控制
export const start = (options?: PerfStartOptions) => bus.start(now(), options)
export const end = (reporter?: Reporter) => {
  if (!bus.isRecording()) return
  const endedAt = now()
  traceIdToEvent.clear()
  traceNameToEvent.clear()
  bus.end(endedAt, reporter)
}

// reporter 注册 API
export const setReporter = (r: Reporter) => bus.setReporter(r)
export const clearReporter = () => bus.setReporter(undefined)
