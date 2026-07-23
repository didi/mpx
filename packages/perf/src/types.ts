/**
 * 单个事件名的聚合统计。
 * - count: 样本数
 * - sum: 总时长（ms）
 * - avg: 均值（end() 时一次性回填）
 * - max: 最大时长（ms）
 */
export interface AggResult {
  count: number
  sum: number
  avg: number
  max: number
}

/** 时间线中的单个瞬时事件。 */
export interface MarkEvent {
  name: string
  /** 相对当前录制窗口 start() 的毫秒偏移。 */
  at: number
}

/** 当前录制窗口的有界 mark 时间线。 */
export interface MarkTimeline {
  events: MarkEvent[]
  /** 超过容量上限后被丢弃的显式 mark 数量。 */
  dropped: number
}

/**
 * Reporter：bus.end() 同步把当前录制窗口的聚合结果交给它。
 * end(reporter?) 传入的局部 reporter 会与全局 reporter 同批触发。
 *
 * 第一个入参是窗口期间实时累加的 `Map<name, AggResult>`；第二个入参是
 * 有序 mark 时间线。timeline 保持可选，以兼容手动单参数调用 reporter。
 */
export type Reporter = (
  measures: Map<string, AggResult>,
  timeline?: MarkTimeline
) => void
