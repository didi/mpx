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

/**
 * Reporter：bus.end() 同步把当前录制窗口的聚合结果交给它。
 * end(reporter?) 传入的局部 reporter 会与全局 reporter 同批触发。
 *
 * 入参是 `Map<name, AggResult>`——窗口期间 push 阶段已实时累加，
 * 此处无原始事件可遍历。业务侧自定义 reporter 直接实现这个签名。
 */
export type Reporter = (agg: Map<string, AggResult>) => void
