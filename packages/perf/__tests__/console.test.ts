/* eslint-disable no-console */
import { createConsoleReporter } from '../src/reporters/console'
import type { AggResult, MarkTimeline } from '../src/types'

describe('console reporter', () => {
  afterEach(() => {
    jest.restoreAllMocks()
  })

  it('未传 timeline 时保持原有 measure 输出格式', () => {
    const log = jest.spyOn(console, 'log').mockImplementation(() => undefined)
    const measures = new Map<string, AggResult>([
      ['render', { count: 2, sum: 4, avg: 2, max: 3 }]
    ])

    createConsoleReporter({ header: false })(measures)

    expect(log).toHaveBeenCalledTimes(1)
    expect(log.mock.calls[0][0]).toBe(
      '[mpx perf] 1 buckets / 2 samples\n' +
      'name    count     sum     avg     max\n' +
      '------  -----  ------  ------  ------\n' +
      'render      2  4.00ms  2.00ms  3.00ms'
    )
  })

  it('timeline 按原始顺序输出，同名 mark 不合并且 filter 保留边界', () => {
    const log = jest.spyOn(console, 'log').mockImplementation(() => undefined)
    const measures = new Map<string, AggResult>([
      ['keep:render', { count: 1, sum: 2, avg: 2, max: 2 }],
      ['hidden', { count: 1, sum: 1, avg: 1, max: 1 }]
    ])
    const timeline: MarkTimeline = {
      events: [
        { name: 'start', at: 0, timestamp: 1000 },
        { name: 'hidden', at: 1, timestamp: 1001 },
        { name: 'keep:ready', at: 2, timestamp: 1002, info: { route: 'pages/index' } },
        { name: 'keep:ready', at: 3, timestamp: 1003 },
        { name: 'end', at: 4, timestamp: 1004 }
      ],
      dropped: 2
    }

    createConsoleReporter({ header: false, filter: 'keep:' })(measures, timeline)

    const output = log.mock.calls[0][0] as string
    expect(output).toContain('[mpx perf] 1 measure bucket / 4 marks')
    expect(output).toContain('measures\n')
    expect(output).toContain('timeline\n')
    expect(output).toContain('timestamp')
    expect(output).toContain('info')
    expect(output).toContain('{"route":"pages/index"}')
    expect(output).toContain('1002')
    expect(output).not.toContain('  hidden')
    const timelineOutput = output.slice(output.indexOf('timeline\n'))
    expect(timelineOutput.indexOf('start')).toBeLessThan(timelineOutput.indexOf('keep:ready'))
    expect(timelineOutput.match(/keep:ready/g)).toHaveLength(2)
    expect(timelineOutput.indexOf('keep:ready')).toBeLessThan(timelineOutput.indexOf('end'))
    expect(output).toContain('mark timeline truncated: 2 events dropped after limit 256')
  })

  it('无 measure 时只输出 start/end 时间线', () => {
    const log = jest.spyOn(console, 'log').mockImplementation(() => undefined)
    const timeline: MarkTimeline = {
      events: [{ name: 'start', at: 0, timestamp: 1000 }, { name: 'end', at: 5, timestamp: 1005 }],
      dropped: 0
    }

    createConsoleReporter({ header: false })(new Map(), timeline)

    const output = log.mock.calls[0][0] as string
    expect(output).toContain('[mpx perf] 0 measure buckets / 2 marks')
    expect(output).not.toContain('measures\n')
    expect(output).toContain('timeline\n')
    expect(output).toContain('start')
    expect(output).toContain('end')
  })
})
