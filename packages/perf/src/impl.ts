import { bus } from './bus'
import type { Reporter } from './types'

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

// 跨作用域的起止配对靠 measure name 匹配；同步代码内首选用 scopeStart/scopeEnd。
const measureStarts = new Map<string, number>()

// scopeStart/scopeEnd 用平行数组持有进行中的 scope，避免每次 scope 分配闭包对象。
// stackName / stackStart 同步增长；freeList 回收已结束的槽位 id。
// 不依赖严格栈序（freeList 处理乱序结束与提前 end）；React render 实际就是栈式，
// freeList 池稳态后槽位数 == 最大并发深度，不再增长。
const stackName: (string | null)[] = []
const stackStart: number[] = []
const freeList: number[] = []
let stackTop = 0

/**
 * 起一段 scope，返回 id 句柄；未录制时返回 -1，调用方据此跳过 scopeEnd。
 * 录制态下也仅做：状态判断、freeList/stackTop 取 id、一次 now()、两次数组下标写。
 * 全程无对象 / 闭包分配——这是高频 render 场景的核心优化。
 */
export function scopeStart (name: string): number {
  if (!bus.isRecording()) return -1
  const id = freeList.length > 0 ? freeList.pop()! : stackTop++
  stackName[id] = name
  stackStart[id] = now()
  return id
}

/**
 * 关闭 id 对应的 scope，把时长累加进聚合。
 * id < 0（未录制时 scopeStart 的返回）或已被 end 过都安全 no-op。
 */
export function scopeEnd (id: number): void {
  if (id < 0) return
  const name = stackName[id]
  if (name === null) return
  const dur = now() - stackStart[id]
  // 清 name 表示该槽空闲，避免重复 end 重复累加；id 回收进 freeList。
  stackName[id] = null
  freeList.push(id)
  bus.pushMeasure(name, dur)
}

/**
 * 向当前录制窗口追加一条有序时间线事件；未录制时不读取时钟。
 */
export function mark (name: string) {
  if (!bus.isRecording()) return
  bus.pushMark(name, now())
}

/**
 * 注册一段跨作用域 measure 的具名起点。
 */
export function measureStart (name: string) {
  measureStarts.set(name, now())
}

/**
 * 结束同名 measure 并聚合耗时；起点命中后立即消费，重复结束安全 noop。
 */
export function measureEnd (name: string) {
  const startedAt = measureStarts.get(name)
  if (startedAt === undefined) return
  measureStarts.delete(name)
  bus.pushMeasure(name, now() - startedAt)
}

// 录制窗口控制
export const start = () => bus.start(now())
export const end = (reporter?: Reporter) => {
  if (!bus.isRecording()) return
  bus.end(now(), reporter)
}

// reporter 注册 API
export const setReporter = (r: Reporter) => bus.setReporter(r)
export const clearReporter = () => bus.setReporter(undefined)
