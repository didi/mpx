import type {
  AggrResult,
  MarkEvent,
  MarkTimeline,
  PerfStartOptions,
  Reporter,
  TraceTimeline
} from './types'
import { consoleReporter } from './reporters/console'

const DEFAULT_MARK_LIMIT = 1024
const DEFAULT_TRACE_LIMIT = 1024

interface PendingTraceEvent {
  name: string
  start: number
  timestamp: number
  duration?: number
  info?: unknown
}

interface PendingTraceTimeline {
  events: PendingTraceEvent[]
  dropped: number
  incomplete: number
}

// 默认 reporter 是 consoleReporter——业务侧不调 setReporter 也能在 console 看到聚合表。
let _reporter: Reporter | undefined = consoleReporter
// 录制状态机：未 start 时所有 pushAggr / pushMark / trace 操作立即丢弃。
let _recording = false
let recordingStart = 0
let markLimit = DEFAULT_MARK_LIMIT
let traceLimit = DEFAULT_TRACE_LIMIT
// 实时聚合容器：push 阶段直接累加，end 时回填 avg。
// aggr 不保留原始事件；mark 与 trace 分别使用独立的有界时间线。
// 每次 start 重建新 Map 而非 clear：end 交给 reporter 的引用就是该窗口的私有数据，
// 业务侧异步消费也不会被下一次窗口覆盖。窗口级别一次 Map 分配可忽略。
let aggrMap = new Map<string, AggrResult>()
let markTimeline: MarkTimeline = { events: [], dropped: 0 }
let traceTimeline: PendingTraceTimeline = { events: [], dropped: 0, incomplete: 0 }

function runReporter (
  reporter: Reporter,
  aggregates: Map<string, AggrResult>,
  marks: MarkTimeline,
  traces: TraceTimeline
) {
  try {
    reporter(aggregates, marks, traces)
  } catch (e) {
    // 故意吞掉 reporter 错误，不影响业务；reporter 自己应对异常负责。
  }
}

function normalizeMarkLimit (limit: number | undefined): number {
  return typeof limit === 'number' && Number.isInteger(limit) && limit >= 2
    ? limit
    : DEFAULT_MARK_LIMIT
}

function normalizeTraceLimit (limit: number | undefined): number {
  return typeof limit === 'number' && Number.isInteger(limit) && limit >= 0
    ? limit
    : DEFAULT_TRACE_LIMIT
}

function finishTraceTimeline (): TraceTimeline {
  const events = traceTimeline.events
  let completed = 0
  let incomplete = 0
  events.forEach((event) => {
    if (event.duration === undefined) {
      incomplete++
    } else {
      events[completed++] = event
    }
  })
  events.length = completed
  traceTimeline.incomplete = incomplete
  return traceTimeline as TraceTimeline
}

export const bus = {
  setReporter (r: Reporter | undefined) {
    _reporter = r
  },

  start (startedAt: number, options?: PerfStartOptions) {
    // 重复 start 视为幂等：沿用已有窗口，不清空已采集的数据；
    // 想强制重开新窗口，先 end 再 start。
    if (_recording) return
    _recording = true
    recordingStart = startedAt
    markLimit = normalizeMarkLimit(options?.markLimit)
    traceLimit = normalizeTraceLimit(options?.traceLimit)
    aggrMap = new Map()
    markTimeline = {
      events: [{ name: 'start', start: 0, timestamp: startedAt }],
      dropped: 0
    }
    traceTimeline = { events: [], dropped: 0, incomplete: 0 }
  },

  end (endedAt: number, reporter?: Reporter) {
    // 未 start 直接 end 是 noop，不报错也不调 reporter。
    if (!_recording) return
    markTimeline.events.push({
      name: 'end',
      start: endedAt - recordingStart,
      timestamp: endedAt
    })
    _recording = false
    // 最后一次性回填 avg，避免 push 阶段反复算除法。
    aggrMap.forEach((s) => {
      s.avg = s.count ? s.sum / s.count : 0
    })
    const traces = finishTraceTimeline()
    // 全局 reporter 先于局部 reporter，但共享同一份 Map 和 timeline 实例——
    // reporter 不应修改它们（如需保留请自行 clone）。
    if (_reporter) runReporter(_reporter, aggrMap, markTimeline, traces)
    if (reporter) runReporter(reporter, aggrMap, markTimeline, traces)
  },

  isRecording (): boolean {
    return _recording
  },

  pushAggr (name: string, dur: number) {
    if (!_recording) return
    let s = aggrMap.get(name)
    if (!s) {
      s = { count: 0, sum: 0, avg: 0, max: 0 }
      aggrMap.set(name, s)
    }
    s.count++
    s.sum += dur
    if (dur > s.max) s.max = dur
  },

  pushMark (name: string, getTimestamp: () => number, info?: unknown) {
    if (!_recording) return
    // 为 end 固定预留最后一个位置。
    if (markTimeline.events.length >= markLimit - 1) {
      markTimeline.dropped++
      return
    }
    const timestamp = getTimestamp()
    const event: MarkEvent = {
      name,
      start: timestamp - recordingStart,
      timestamp
    }
    if (info !== undefined) event.info = info
    markTimeline.events.push(event)
  },

  reserveTrace (name: string, getStartedAt: () => number): number {
    if (!_recording) return -1
    if (traceTimeline.events.length >= traceLimit) {
      traceTimeline.dropped++
      return -1
    }
    const startedAt = getStartedAt()
    traceTimeline.events.push({
      name,
      start: startedAt - recordingStart,
      timestamp: startedAt
    })
    return traceTimeline.events.length - 1
  },

  finishTrace (eventIndex: number, endedAt: number, info?: unknown) {
    if (!_recording) return
    const event = traceTimeline.events[eventIndex]
    if (!event || event.duration !== undefined) return
    event.duration = endedAt - event.timestamp
    if (info !== undefined) event.info = info
  }
}
