/**
 * 探针事件类型。每条事件对应一次 mark 或 measure。
 */
export interface PerfMarkEvent {
  type: 'mark'
  name: string
  ts: number
  meta?: object
}

export interface PerfMeasureEvent {
  type: 'measure'
  name: string
  /** 起始时刻（performance.now 时间戳） */
  start: number
  /** 持续时长（ms） */
  dur: number
  meta?: object
}

export type PerfEvent = PerfMarkEvent | PerfMeasureEvent

/**
 * Reporter：bus.end() 同步把当前录制窗口的事件交给它。
 * 业务侧自定义 reporter 时直接实现这个签名即可。
 */
export type Reporter = (events: PerfEvent[]) => void

/**
 * 单个事件名的聚合统计。
 */
export interface AggResult {
  count: number
  sum: number
  avg: number
  max: number
}
