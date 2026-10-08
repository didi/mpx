/* eslint-disable no-console */
import { createConsoleReporter } from '../src/reporters/console'
import type {
  AggrResult,
  MarkTimeline,
  TraceTimeline
} from '../src/types'

describe('console reporter', () => {
  afterEach(() => {
    jest.restoreAllMocks()
  })

  it('只传聚合 Map 时保持旧式输出格式', () => {
    const log = jest.spyOn(console, 'log').mockImplementation(() => undefined)
    const aggregates = new Map<string, AggrResult>([
      ['render', { count: 2, sum: 4, avg: 2, max: 3 }]
    ])

    createConsoleReporter({ header: false })(aggregates)

    expect(log).toHaveBeenCalledTimes(1)
    expect(log.mock.calls[0][0]).toBe(
      '[mpx perf] 1 buckets / 2 samples\n' +
      'name    count     sum     avg     max\n' +
      '------  -----  ------  ------  ------\n' +
      'render      2  4.00ms  2.00ms  3.00ms'
    )
  })

  it('分别输出 aggregates、traces、marks 并应用 filter', () => {
    const log = jest.spyOn(console, 'log').mockImplementation(() => undefined)
    const aggregates = new Map<string, AggrResult>([
      ['keep:render', { count: 1, sum: 2, avg: 2, max: 2 }],
      ['hidden', { count: 1, sum: 1, avg: 1, max: 1 }]
    ])
    const marks: MarkTimeline = {
      events: [
        { name: 'start', start: 0, timestamp: 100 },
        { name: 'hidden', start: 1, timestamp: 101 },
        { name: 'keep:ready', start: 2, timestamp: 102, info: { source: 'cache' } },
        { name: 'end', start: 4, timestamp: 104 }
      ],
      dropped: 2
    }
    const traces: TraceTimeline = {
      events: [
        { name: 'hidden', start: 1, timestamp: 101, duration: 2 },
        { name: 'keep:task', start: 2, timestamp: 102, duration: 3, info: { id: 1 } }
      ],
      dropped: 3,
      incomplete: 4
    }

    createConsoleReporter({ header: false, filter: 'keep:' })(aggregates, marks, traces)

    const output = log.mock.calls[0][0] as string
    expect(output).toContain('[mpx perf] 1 aggregate bucket / 1 traces / 3 marks')
    expect(output).toContain('aggregates\n')
    expect(output).toContain('traces\n')
    expect(output).toContain('marks\n')
    expect(output).not.toContain('  hidden')
    expect(output).toContain('102.00ms')
    expect(output).toContain('3.00ms')
    expect(output).toContain('{"id":1}')
    expect(output).toContain('{"source":"cache"}')
    const markOutput = output.slice(
      output.lastIndexOf('marks\n'),
      output.indexOf('[mpx perf] mark timeline')
    )
    expect(markOutput.indexOf('start')).toBeLessThan(markOutput.indexOf('keep:ready'))
    expect(markOutput.indexOf('keep:ready')).toBeLessThan(markOutput.indexOf('end'))
    expect(output).toContain('mark timeline truncated: 2 events dropped')
    expect(output).toContain('trace timeline truncated: 3 events dropped')
    expect(output).toContain('trace timeline incomplete: 4 events unfinished')
  })

  it('trace 与 mark 保持原始顺序和原始 index', () => {
    const log = jest.spyOn(console, 'log').mockImplementation(() => undefined)
    const marks: MarkTimeline = {
      events: [
        { name: 'start', start: 0, timestamp: 0 },
        { name: 'mark:b', start: 2, timestamp: 2 },
        { name: 'mark:a', start: 3, timestamp: 3 },
        { name: 'end', start: 4, timestamp: 4 }
      ],
      dropped: 0
    }
    const traces: TraceTimeline = {
      events: [
        { name: 'trace:b', start: 1, timestamp: 1, duration: 4 },
        { name: 'trace:a', start: 2, timestamp: 2, duration: 1 }
      ],
      dropped: 0,
      incomplete: 0
    }

    createConsoleReporter({ header: false, sortBy: 'max' })(new Map(), marks, traces)

    const output = log.mock.calls[0][0] as string
    expect(output.indexOf('trace:b')).toBeLessThan(output.indexOf('trace:a'))
    expect(output.indexOf('mark:b')).toBeLessThan(output.indexOf('mark:a'))
  })

  it('循环引用和异常字符串化不会中断输出', () => {
    const log = jest.spyOn(console, 'log').mockImplementation(() => undefined)
    const info: { self?: unknown; toString: () => string } = {
      toString: () => { throw new Error('boom') }
    }
    info.self = info
    const marks: MarkTimeline = {
      events: [
        { name: 'start', start: 0, timestamp: 0 },
        { name: 'ready', start: 1, timestamp: 1, info },
        { name: 'end', start: 2, timestamp: 2 }
      ],
      dropped: 0
    }

    expect(() => createConsoleReporter({ header: false })(new Map(), marks)).not.toThrow()
    expect(log.mock.calls[0][0]).toContain('[unprintable]')
  })

  it('未传 trace 参数时仍正常输出 mark 时间线', () => {
    const log = jest.spyOn(console, 'log').mockImplementation(() => undefined)
    const marks: MarkTimeline = {
      events: [
        { name: 'start', start: 0, timestamp: 10 },
        { name: 'end', start: 5, timestamp: 15 }
      ],
      dropped: 0
    }

    createConsoleReporter({ header: false })(new Map(), marks)

    const output = log.mock.calls[0][0] as string
    expect(output).toContain('/ 0 traces / 2 marks')
    expect(output).toContain('marks\n')
  })
})
