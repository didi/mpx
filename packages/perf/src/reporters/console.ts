import type { AggResult, MarkTimeline, Reporter } from '../types'

export interface ConsoleReporterOptions {
  /** 排序字段，默认按 sum 降序 */
  sortBy?: 'sum' | 'avg' | 'max' | 'count'
  /** 仅打印事件名匹配该正则 / 字符串前缀的桶 */
  filter?: RegExp | string
  /** 是否带 console.group 头，默认 true */
  header?: boolean
}

interface Row {
  name: string
  count: number
  sum: number
  avg: number
  max: number
}

interface TimelineRow {
  index: number
  at: number
  name: string
}

function pad (s: string, width: number, right = false): string {
  if (s.length >= width) return s
  const fill = ' '.repeat(width - s.length)
  return right ? fill + s : s + fill
}

function fmtMs (n: number): string {
  return n.toFixed(2) + 'ms'
}

function matchesFilter (name: string, filter?: RegExp | string): boolean {
  if (!filter) return true
  if (typeof filter === 'string') return name.startsWith(filter)
  filter.lastIndex = 0
  return filter.test(name)
}

/**
 * 工厂函数：根据 options 生成一个 console reporter。
 *
 * measure 直接读取实时聚合结果，mark 则读取有界的有序时间线。
 *
 * 输出形式刻意避开 console.table —— React Native 远程调试 / Hermes inspector
 * 对 console.table 的支持参差不齐（典型表现是把每行渲染成 `{…}` 不展开），
 * 这里用对齐字符串 + 单条 console.log 输出，跨 RN / 浏览器 / Node 一致可读。
 */
export function createConsoleReporter (options: ConsoleReporterOptions = {}): Reporter {
  const { sortBy = 'sum', filter, header = true } = options

  return (agg: Map<string, AggResult>, timeline?: MarkTimeline) => {
    const rows: Row[] = []
    let totalCount = 0
    agg.forEach((s, name) => {
      if (!matchesFilter(name, filter)) return
      totalCount += s.count
      rows.push({ name, count: s.count, sum: s.sum, avg: s.avg, max: s.max })
    })

    rows.sort((a, b) => b[sortBy] - a[sortBy])

    // 列宽：取 max(列名长度, 各行该列字符串长度)，保证终端 / RN console 都对齐
    let nameW = 'name'.length
    let countW = 'count'.length
    let sumW = 'sum'.length
    let avgW = 'avg'.length
    let maxW = 'max'.length
    const cells = rows.map(r => {
      const c = {
        name: r.name,
        count: String(r.count),
        sum: fmtMs(r.sum),
        avg: fmtMs(r.avg),
        max: fmtMs(r.max)
      }
      if (c.name.length > nameW) nameW = c.name.length
      if (c.count.length > countW) countW = c.count.length
      if (c.sum.length > sumW) sumW = c.sum.length
      if (c.avg.length > avgW) avgW = c.avg.length
      if (c.max.length > maxW) maxW = c.max.length
      return c
    })

    const headerLine = `${pad('name', nameW)}  ${pad('count', countW, true)}  ${pad('sum', sumW, true)}  ${pad('avg', avgW, true)}  ${pad('max', maxW, true)}`
    const sepLine = `${'-'.repeat(nameW)}  ${'-'.repeat(countW)}  ${'-'.repeat(sumW)}  ${'-'.repeat(avgW)}  ${'-'.repeat(maxW)}`
    const bodyLines = cells.map(c =>
      `${pad(c.name, nameW)}  ${pad(c.count, countW, true)}  ${pad(c.sum, sumW, true)}  ${pad(c.avg, avgW, true)}  ${pad(c.max, maxW, true)}`
    )

    let title = `[mpx perf] ${rows.length} buckets / ${totalCount} samples`
    let content = rows.length ? [headerLine, sepLine, ...bodyLines].join('\n') : '(empty)'

    if (timeline) {
      const timelineRows: TimelineRow[] = []
      const lastIndex = timeline.events.length - 1
      timeline.events.forEach((event, index) => {
        const boundary = (index === 0 && event.name === 'start') ||
          (index === lastIndex && event.name === 'end')
        if (boundary || matchesFilter(event.name, filter)) {
          timelineRows.push({ index, at: event.at, name: event.name })
        }
      })

      let indexW = 'index'.length
      let atW = 'at'.length
      let timelineNameW = 'name'.length
      const timelineCells = timelineRows.map(row => {
        const cell = {
          index: String(row.index),
          at: fmtMs(row.at),
          name: row.name
        }
        if (cell.index.length > indexW) indexW = cell.index.length
        if (cell.at.length > atW) atW = cell.at.length
        if (cell.name.length > timelineNameW) timelineNameW = cell.name.length
        return cell
      })
      const timelineHeader = `${pad('index', indexW, true)}  ${pad('at', atW, true)}  ${pad('name', timelineNameW)}`
      const timelineSep = `${'-'.repeat(indexW)}  ${'-'.repeat(atW)}  ${'-'.repeat(timelineNameW)}`
      const timelineBody = timelineCells.map(cell =>
        `${pad(cell.index, indexW, true)}  ${pad(cell.at, atW, true)}  ${pad(cell.name, timelineNameW)}`
      )
      const sections: string[] = []
      if (rows.length) sections.push(['measures', headerLine, sepLine, ...bodyLines].join('\n'))
      if (timelineRows.length) sections.push(['timeline', timelineHeader, timelineSep, ...timelineBody].join('\n'))
      if (timeline.dropped > 0) {
        sections.push(`[mpx perf] mark timeline truncated: ${timeline.dropped} events dropped after limit 256`)
      }
      title = `[mpx perf] ${rows.length} measure ${rows.length === 1 ? 'bucket' : 'buckets'} / ${timelineRows.length} marks`
      content = sections.length ? sections.join('\n\n') : '(empty)'
    }

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
}

/**
 * 默认 reporter：bus 在未被 setReporter 替换时使用它。
 * 行为等价于 createConsoleReporter() 默认参数。
 */
export const consoleReporter: Reporter = createConsoleReporter()
