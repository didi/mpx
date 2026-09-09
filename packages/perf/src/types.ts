/**
 * 单个事件名的聚合统计。
 * - count: 样本数
 * - sum: 总时长（ms）
 * - avg: 均值（end() 时一次性回填）
 * - max: 最大时长（ms）
 */
export interface AggrResult {
  count: number
  sum: number
  avg: number
  max: number
}

/** 时间线中的单个瞬时事件。 */
export interface MarkEvent {
  name: string
  /** 相对当前录制窗口 start() 的毫秒偏移。 */
  start: number
  /** mark 发生时读取的原始时间戳。 */
  timestamp: number
  /** 用户自定义信息，按引用保存。 */
  info?: unknown
}

/** 当前录制窗口的有界 mark 时间线。 */
export interface MarkTimeline {
  events: MarkEvent[]
  /** 超过容量上限后被丢弃的显式 mark 数量。 */
  dropped: number
}

/** 时间线中的单个区段事件。 */
export interface TraceEvent {
  name: string
  /** 相对当前录制窗口 start() 的毫秒偏移。 */
  start: number
  /** traceStart() 读取的原始开始时间戳。 */
  timestamp: number
  /** 区段持续时间（ms）。 */
  duration: number
  /** 用户自定义信息，按引用保存。 */
  info?: unknown
}

/** 当前录制窗口的有界 trace 时间线。 */
export interface TraceTimeline {
  /** 只包含已完成区段，顺序与 traceStart 调用顺序一致。 */
  events: TraceEvent[]
  /** 超过容量上限后被丢弃的 trace 数量。 */
  dropped: number
  /** 已开始但窗口结束前未成功结束的区段数量。 */
  incomplete: number
}

export interface PerfStartOptions {
  /** MarkTimeline 最大事件数，包含 start/end 边界，默认 1024。 */
  markLimit?: number
  /** TraceTimeline 最大区段数，默认 1024。 */
  traceLimit?: number
}

/**
 * Reporter：bus.end() 同步把当前录制窗口的聚合结果交给它。
 * end(reporter?) 传入的局部 reporter 会与全局 reporter 同批触发。
 *
 * 第一个入参是窗口期间实时累加的 `Map<name, AggrResult>`；第二、三个入参
 * 分别是有序 mark 和 trace 时间线。时间线保持可选，以兼容手动调用 reporter。
 */
export type Reporter = (
  aggregates: Map<string, AggrResult>,
  marks?: MarkTimeline,
  traces?: TraceTimeline
) => void
