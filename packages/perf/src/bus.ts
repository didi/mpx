import type { PerfEvent, Reporter } from './types'
import { consoleReporter } from './reporters/console'

// 单次录制窗口最大事件数。FIFO 兜底，避免业务忘 end 导致内存无界增长。
const QUEUE_LIMIT = 4096

// 默认 reporter 是 consoleReporter——业务侧不调 setReporter 也能在 console 看到聚合表。
let _reporter: Reporter | undefined = consoleReporter
// 录制状态机：未 start 时所有 push 立即丢弃。
let _recording = false
let queue: PerfEvent[] = []

export const bus = {
  setReporter (r: Reporter | undefined) {
    _reporter = r
  },

  start () {
    // 重复 start 视为幂等：沿用已有窗口，不清空已采集的数据；
    // 想强制重开新窗口，先 end 再 start。
    if (_recording) return
    _recording = true
    queue = []
  },

  end (reporter?: Reporter) {
    // 未 start 直接 end 是 noop，不报错也不调 reporter。
    if (!_recording) return
    _recording = false
    const batch = queue
    // 先换队列再交给 reporter，防 reporter 同步 push 重入污染。
    queue = []
    if (batch.length === 0) return
    if (_reporter) runReporter(_reporter, batch)
    if (reporter) runReporter(reporter, batch)
  },

  push (e: PerfEvent) {
    if (!_recording) return
    if (queue.length >= QUEUE_LIMIT) queue.shift()
    queue.push(e)
  }
}

function runReporter (reporter: Reporter, batch: PerfEvent[]) {
  try {
    reporter(batch)
  } catch (e) {
    // 故意吞掉 reporter 错误，不影响业务；reporter 自己应对异常负责。
  }
}
