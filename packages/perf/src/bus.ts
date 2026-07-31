import type { AggResult, MarkTimeline, Reporter } from './types'
import { consoleReporter } from './reporters/console'

const MARK_LIMIT = 256

// 默认 reporter 是 consoleReporter——业务侧不调 setReporter 也能在 console 看到聚合表。
let _reporter: Reporter | undefined = consoleReporter
// 录制状态机：未 start 时所有 pushMeasure / pushMark 立即丢弃。
let _recording = false
let recordingStart = 0
// 实时聚合容器：push 阶段直接累加，end 时回填 avg。
// measure 不保留原始事件；mark 只保留最多 256 条有序时间线事件。
// 每次 start 重建新 Map 而非 clear：end 交给 reporter 的引用就是该窗口的私有数据，
// 业务侧异步消费也不会被下一次窗口覆盖。窗口级别一次 Map 分配可忽略。
let aggMap = new Map<string, AggResult>()
let timeline: MarkTimeline = { events: [], dropped: 0 }

function runReporter (reporter: Reporter, agg: Map<string, AggResult>, marks: MarkTimeline) {
  try {
    reporter(agg, marks)
  } catch (e) {
    // 故意吞掉 reporter 错误，不影响业务；reporter 自己应对异常负责。
  }
}

export const bus = {
  setReporter (r: Reporter | undefined) {
    _reporter = r
  },

  start (startedAt: number) {
    // 重复 start 视为幂等：沿用已有窗口，不清空已采集的数据；
    // 想强制重开新窗口，先 end 再 start。
    if (_recording) return
    _recording = true
    recordingStart = startedAt
    aggMap = new Map()
    timeline = { events: [{ name: 'start', at: 0 }], dropped: 0 }
  },

  end (endedAt: number, reporter?: Reporter) {
    // 未 start 直接 end 是 noop，不报错也不调 reporter。
    if (!_recording) return
    timeline.events.push({ name: 'end', at: endedAt - recordingStart })
    _recording = false
    // 最后一次性回填 avg，避免 push 阶段反复算除法。
    aggMap.forEach((s) => {
      s.avg = s.count ? s.sum / s.count : 0
    })
    // 全局 reporter 先于局部 reporter，但共享同一份 Map 和 timeline 实例——
    // reporter 不应修改它们（如需保留请自行 clone）。
    if (_reporter) runReporter(_reporter, aggMap, timeline)
    if (reporter) runReporter(reporter, aggMap, timeline)
  },

  isRecording (): boolean {
    return _recording
  },

  pushMeasure (name: string, dur: number) {
    if (!_recording) return
    let s = aggMap.get(name)
    if (!s) {
      s = { count: 0, sum: 0, avg: 0, max: 0 }
      aggMap.set(name, s)
    }
    s.count++
    s.sum += dur
    if (dur > s.max) s.max = dur
  },

  pushMark (name: string, timestamp: number) {
    if (!_recording) return
    // 为 end 固定预留最后一个位置，因此显式 mark 最多保留 254 条。
    if (timeline.events.length < MARK_LIMIT - 1) {
      timeline.events.push({ name, at: timestamp - recordingStart })
    } else {
      timeline.dropped++
    }
  }
}
