import type {
  AggrResult,
  MarkTimeline,
  Reporter,
  TraceTimeline
} from '../types'

export interface ConsoleReporterOptions {
  /** 排序字段，默认按 sum 降序 */
  sortBy?: 'sum' | 'avg' | 'max' | 'count'
  /** 仅打印事件名匹配该正则 / 字符串前缀的数据 */
  filter?: RegExp | string
  /** 是否带 console.group 头，默认 true */
  header?: boolean
}

interface AggrRow {
  name: string
  count: number
  sum: number
  avg: number
  max: number
}

interface SequenceRow {
  index: number
  start: number
  timestamp: number
  name: string
  info?: unknown
}

interface TraceRow extends SequenceRow {
  duration: number
}

function pad (s: string, width: number, right = false): string {
  if (s.length >= width) return s
  const fill = ' '.repeat(width - s.length)
  return right ? fill + s : s + fill
}

function fmtMs (n: number): string {
  return n.toFixed(2) + 'ms'
}

function fmtInfo (info: unknown): string {
  try {
    const json = JSON.stringify(info)
    if (json !== undefined) return json
  } catch (e) {}
  try {
    return String(info)
  } catch (e) {
    return '[unprintable]'
  }
}

function matchesFilter (name: string, filter?: RegExp | string): boolean {
  if (!filter) return true
  if (typeof filter === 'string') return name.startsWith(filter)
  filter.lastIndex = 0
  return filter.test(name)
}

function formatAggrRows (rows: AggrRow[]): string {
  let nameW = 'name'.length
  let countW = 'count'.length
  let sumW = 'sum'.length
  let avgW = 'avg'.length
  let maxW = 'max'.length
  const cells = rows.map(row => {
    const cell = {
      name: row.name,
      count: String(row.count),
      sum: fmtMs(row.sum),
      avg: fmtMs(row.avg),
      max: fmtMs(row.max)
    }
    if (cell.name.length > nameW) nameW = cell.name.length
    if (cell.count.length > countW) countW = cell.count.length
    if (cell.sum.length > sumW) sumW = cell.sum.length
    if (cell.avg.length > avgW) avgW = cell.avg.length
    if (cell.max.length > maxW) maxW = cell.max.length
    return cell
  })

  const header = `${pad('name', nameW)}  ${pad('count', countW, true)}  ${pad('sum', sumW, true)}  ${pad('avg', avgW, true)}  ${pad('max', maxW, true)}`
  const separator = `${'-'.repeat(nameW)}  ${'-'.repeat(countW)}  ${'-'.repeat(sumW)}  ${'-'.repeat(avgW)}  ${'-'.repeat(maxW)}`
  const body = cells.map(cell =>
    `${pad(cell.name, nameW)}  ${pad(cell.count, countW, true)}  ${pad(cell.sum, sumW, true)}  ${pad(cell.avg, avgW, true)}  ${pad(cell.max, maxW, true)}`
  )
  return [header, separator, ...body].join('\n')
}

function formatTraceRows (rows: TraceRow[]): string {
  const showInfo = rows.some(row => row.info !== undefined)
  let indexW = 'index'.length
  let startW = 'start'.length
  let timestampW = 'timestamp'.length
  let durationW = 'duration'.length
  let nameW = 'name'.length
  let infoW = 'info'.length
  const cells = rows.map(row => {
    const cell = {
      index: String(row.index),
      start: fmtMs(row.start),
      timestamp: fmtMs(row.timestamp),
      duration: fmtMs(row.duration),
      name: row.name,
      info: row.info === undefined ? '' : fmtInfo(row.info)
    }
    if (cell.index.length > indexW) indexW = cell.index.length
    if (cell.start.length > startW) startW = cell.start.length
    if (cell.timestamp.length > timestampW) timestampW = cell.timestamp.length
    if (cell.duration.length > durationW) durationW = cell.duration.length
    if (cell.name.length > nameW) nameW = cell.name.length
    if (cell.info.length > infoW) infoW = cell.info.length
    return cell
  })

  const infoHeader = showInfo ? `  ${pad('info', infoW)}` : ''
  const infoSeparator = showInfo ? `  ${'-'.repeat(infoW)}` : ''
  const header = `${pad('index', indexW, true)}  ${pad('start', startW, true)}  ${pad('timestamp', timestampW, true)}  ${pad('duration', durationW, true)}  ${pad('name', nameW)}${infoHeader}`
  const separator = `${'-'.repeat(indexW)}  ${'-'.repeat(startW)}  ${'-'.repeat(timestampW)}  ${'-'.repeat(durationW)}  ${'-'.repeat(nameW)}${infoSeparator}`
  const body = cells.map(cell => {
    const info = showInfo ? `  ${pad(cell.info, infoW)}` : ''
    return `${pad(cell.index, indexW, true)}  ${pad(cell.start, startW, true)}  ${pad(cell.timestamp, timestampW, true)}  ${pad(cell.duration, durationW, true)}  ${pad(cell.name, nameW)}${info}`
  })
  return [header, separator, ...body].join('\n')
}

function formatMarkRows (rows: SequenceRow[]): string {
  const showInfo = rows.some(row => row.info !== undefined)
  let indexW = 'index'.length
  let startW = 'start'.length
  let timestampW = 'timestamp'.length
  let nameW = 'name'.length
  let infoW = 'info'.length
  const cells = rows.map(row => {
    const cell = {
      index: String(row.index),
      start: fmtMs(row.start),
      timestamp: fmtMs(row.timestamp),
      name: row.name,
      info: row.info === undefined ? '' : fmtInfo(row.info)
    }
    if (cell.index.length > indexW) indexW = cell.index.length
    if (cell.start.length > startW) startW = cell.start.length
    if (cell.timestamp.length > timestampW) timestampW = cell.timestamp.length
    if (cell.name.length > nameW) nameW = cell.name.length
    if (cell.info.length > infoW) infoW = cell.info.length
    return cell
  })

  const infoHeader = showInfo ? `  ${pad('info', infoW)}` : ''
  const infoSeparator = showInfo ? `  ${'-'.repeat(infoW)}` : ''
  const header = `${pad('index', indexW, true)}  ${pad('start', startW, true)}  ${pad('timestamp', timestampW, true)}  ${pad('name', nameW)}${infoHeader}`
  const separator = `${'-'.repeat(indexW)}  ${'-'.repeat(startW)}  ${'-'.repeat(timestampW)}  ${'-'.repeat(nameW)}${infoSeparator}`
  const body = cells.map(cell => {
    const info = showInfo ? `  ${pad(cell.info, infoW)}` : ''
    return `${pad(cell.index, indexW, true)}  ${pad(cell.start, startW, true)}  ${pad(cell.timestamp, timestampW, true)}  ${pad(cell.name, nameW)}${info}`
  })
  return [header, separator, ...body].join('\n')
}

/**
 * 工厂函数：根据 options 生成一个 console reporter。
 *
 * 聚合结果按配置排序；trace 与 mark 保持采集顺序。输出使用对齐字符串，
 * 避免 React Native 远程调试 / Hermes inspector 对 console.table 的兼容差异。
 */
export function createConsoleReporter (options: ConsoleReporterOptions = {}): Reporter {
  const { sortBy = 'sum', filter, header = true } = options

  return (
    aggregates: Map<string, AggrResult>,
    marks?: MarkTimeline,
    traces?: TraceTimeline
  ) => {
    const aggrRows: AggrRow[] = []
    let totalCount = 0
    aggregates.forEach((result, name) => {
      if (!matchesFilter(name, filter)) return
      totalCount += result.count
      aggrRows.push({
        name,
        count: result.count,
        sum: result.sum,
        avg: result.avg,
        max: result.max
      })
    })
    aggrRows.sort((a, b) => b[sortBy] - a[sortBy])

    // 兼容外部只传聚合 Map 的旧式手动调用。
    if (!marks && !traces) {
      const title = `[mpx perf] ${aggrRows.length} buckets / ${totalCount} samples`
      const content = aggrRows.length ? formatAggrRows(aggrRows) : '(empty)'
      printConsole(title, content, header)
      return
    }

    const traceRows: TraceRow[] = []
    if (traces) {
      traces.events.forEach((event, index) => {
        if (!matchesFilter(event.name, filter)) return
        traceRows.push({
          index,
          start: event.start,
          timestamp: event.timestamp,
          duration: event.duration,
          name: event.name,
          info: event.info
        })
      })
    }

    const markRows: SequenceRow[] = []
    if (marks) {
      const lastIndex = marks.events.length - 1
      marks.events.forEach((event, index) => {
        const boundary = (index === 0 && event.name === 'start') ||
          (index === lastIndex && event.name === 'end')
        if (!boundary && !matchesFilter(event.name, filter)) return
        markRows.push({
          index,
          start: event.start,
          timestamp: event.timestamp,
          name: event.name,
          info: event.info
        })
      })
    }

    const sections: string[] = []
    if (aggrRows.length) sections.push(['aggregates', formatAggrRows(aggrRows)].join('\n'))
    if (traceRows.length) sections.push(['traces', formatTraceRows(traceRows)].join('\n'))
    if (markRows.length) sections.push(['marks', formatMarkRows(markRows)].join('\n'))
    if (marks && marks.dropped > 0) {
      sections.push(`[mpx perf] mark timeline truncated: ${marks.dropped} events dropped`)
    }
    if (traces && traces.dropped > 0) {
      sections.push(`[mpx perf] trace timeline truncated: ${traces.dropped} events dropped`)
    }
    if (traces && traces.incomplete > 0) {
      sections.push(`[mpx perf] trace timeline incomplete: ${traces.incomplete} events unfinished`)
    }

    const title = `[mpx perf] ${aggrRows.length} aggregate ${aggrRows.length === 1 ? 'bucket' : 'buckets'} / ${traceRows.length} traces / ${markRows.length} marks`
    printConsole(title, sections.length ? sections.join('\n\n') : '(empty)', header)
  }
}

function printConsole (title: string, content: string, header: boolean): void {
  const text = `${title}\n${content}`

  /* eslint-disable no-console */
  if (header && typeof console.group === 'function') {
    console.group(title)
    console.log(content)
  } else {
    console.log(text)
  }
  if (header && typeof console.groupEnd === 'function') {
    console.groupEnd()
  }
  /* eslint-enable no-console */
}

/** 默认 reporter，行为等价于 createConsoleReporter()。 */
export const consoleReporter: Reporter = createConsoleReporter()
