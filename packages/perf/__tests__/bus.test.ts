import { bus } from '../src/bus'
import type {
  AggrResult,
  MarkTimeline,
  TraceTimeline
} from '../src/types'

interface Captured {
  aggregates: Map<string, AggrResult>
  marks: MarkTimeline
  traces: TraceTimeline
}

const timestamp = (value: number) => () => value

describe('bus 录制窗口', () => {
  let captured: Captured[] = []

  beforeEach(() => {
    captured = []
    bus.setReporter((aggregates, marks, traces) => {
      captured.push({
        aggregates,
        marks: marks!,
        traces: traces!
      })
    })
  })

  afterEach(() => {
    if (bus.isRecording()) bus.end(0)
    bus.setReporter(undefined)
  })

  it('未 start 时丢弃聚合、mark 和 trace，end 是 noop', () => {
    bus.pushAggr('a', 1)
    bus.pushMark('ready', timestamp(1))
    expect(bus.reserveTrace('task', timestamp(1))).toBe(-1)
    bus.finishTrace(0, 2)
    bus.end(2)
    expect(captured).toHaveLength(0)
  })

  it('实时聚合 count/sum/avg/max', () => {
    bus.start(10)
    bus.pushAggr('a', 1)
    bus.pushAggr('a', 3)
    bus.pushAggr('b', 5)
    bus.end(20)

    const aggregates = captured[0].aggregates
    expect(aggregates.get('a')).toEqual({ count: 2, sum: 4, avg: 2, max: 3 })
    expect(aggregates.get('b')).toEqual({ count: 1, sum: 5, avg: 5, max: 5 })
  })

  it('mark 保存相对时间、原始时间戳和 info 引用', () => {
    const info = { source: 'cache' }
    bus.start(10)
    bus.pushMark('ready', timestamp(12), info)
    bus.pushMark('plain', timestamp(13))
    info.source = 'network'
    bus.end(20)

    expect(captured[0].marks).toEqual({
      events: [
        { name: 'start', start: 0, timestamp: 10 },
        { name: 'ready', start: 2, timestamp: 12, info },
        { name: 'plain', start: 3, timestamp: 13 },
        { name: 'end', start: 10, timestamp: 20 }
      ],
      dropped: 0
    })
    expect(Object.prototype.hasOwnProperty.call(captured[0].marks.events[2], 'info')).toBe(false)
  })

  it('trace 按 start 顺序输出并压缩未完成事件', () => {
    const info = { moduleId: 42 }
    bus.start(100)
    const parent = bus.reserveTrace('parent', timestamp(101))
    const child = bus.reserveTrace('child', timestamp(102))
    const incomplete = bus.reserveTrace('incomplete', timestamp(103))
    bus.finishTrace(child, 105, info)
    bus.finishTrace(child, 110)
    bus.finishTrace(parent, 111)
    bus.end(120)

    expect(incomplete).toBe(2)
    expect(captured[0].traces).toEqual({
      events: [
        { name: 'parent', start: 1, timestamp: 101, duration: 10 },
        { name: 'child', start: 2, timestamp: 102, duration: 3, info }
      ],
      dropped: 0,
      incomplete: 1
    })
  })

  it('markLimit 与 traceLimit 相互独立并保留各自前缀', () => {
    bus.start(0, { markLimit: 4, traceLimit: 2 })
    bus.pushMark('mark-0', timestamp(1))
    bus.pushMark('mark-1', timestamp(2))
    bus.pushMark('mark-dropped', timestamp(3))
    const first = bus.reserveTrace('trace-0', timestamp(1))
    const second = bus.reserveTrace('trace-1', timestamp(2))
    expect(bus.reserveTrace('trace-dropped', timestamp(3))).toBe(-1)
    bus.finishTrace(first, 4)
    bus.finishTrace(second, 5)
    bus.end(6)

    expect(captured[0].marks.events.map(event => event.name)).toEqual([
      'start',
      'mark-0',
      'mark-1',
      'end'
    ])
    expect(captured[0].marks.dropped).toBe(1)
    expect(captured[0].traces.events.map(event => event.name)).toEqual([
      'trace-0',
      'trace-1'
    ])
    expect(captured[0].traces.dropped).toBe(1)
  })

  it('默认容量均为 1024', () => {
    bus.start(0)
    Array.from({ length: 1030 }).forEach((_, index) => {
      bus.pushMark(`mark-${index}`, timestamp(index + 1))
      const eventIndex = bus.reserveTrace(`trace-${index}`, timestamp(index + 1))
      if (eventIndex >= 0) bus.finishTrace(eventIndex, index + 2)
    })
    bus.end(2000)

    expect(captured[0].marks.events).toHaveLength(1024)
    expect(captured[0].marks.events[1022].name).toBe('mark-1021')
    expect(captured[0].marks.events[1023].name).toBe('end')
    expect(captured[0].marks.dropped).toBe(8)
    expect(captured[0].traces.events).toHaveLength(1024)
    expect(captured[0].traces.events[1023].name).toBe('trace-1023')
    expect(captured[0].traces.dropped).toBe(6)
  })

  it('traceLimit 为 0 时只累计 dropped', () => {
    bus.start(0, { traceLimit: 0 })
    expect(bus.reserveTrace('a', timestamp(1))).toBe(-1)
    expect(bus.reserveTrace('b', timestamp(2))).toBe(-1)
    bus.end(3)
    expect(captured[0].traces).toEqual({
      events: [],
      dropped: 2,
      incomplete: 0
    })
  })

  it('无效容量回退默认值', () => {
    bus.start(0, { markLimit: 1, traceLimit: -1 })
    Array.from({ length: 1025 }).forEach((_, index) => {
      bus.pushMark(`mark-${index}`, timestamp(index))
      bus.reserveTrace(`trace-${index}`, timestamp(index))
    })
    bus.end(2000)

    expect(captured[0].marks.events).toHaveLength(1024)
    expect(captured[0].marks.dropped).toBe(3)
    expect(captured[0].traces.dropped).toBe(1)
    expect(captured[0].traces.incomplete).toBe(1024)
  })

  it('重复 start 幂等且忽略新容量，新窗口重新读取配置', () => {
    bus.start(10, { markLimit: 3, traceLimit: 1 })
    bus.start(100, { markLimit: 10, traceLimit: 10 })
    bus.pushMark('first', timestamp(11))
    bus.pushMark('dropped', timestamp(12))
    const firstTrace = bus.reserveTrace('first', timestamp(11))
    expect(bus.reserveTrace('dropped', timestamp(12))).toBe(-1)
    bus.finishTrace(firstTrace, 13)
    bus.end(20)

    expect(captured[0].marks.events.map(event => event.name)).toEqual(['start', 'first', 'end'])
    expect(captured[0].traces.dropped).toBe(1)

    bus.start(30, { markLimit: 4, traceLimit: 2 })
    bus.pushMark('second', timestamp(31))
    bus.pushMark('third', timestamp(32))
    bus.end(33)
    expect(captured[1].marks.events.map(event => event.name)).toEqual([
      'start',
      'second',
      'third',
      'end'
    ])
  })

  it('全局与局部 reporter 收到相同引用，reporter 异常不影响 end', () => {
    let local: Captured | undefined
    bus.start(0)
    bus.pushAggr('a', 1)
    bus.end(1, (aggregates, marks, traces) => {
      local = { aggregates, marks: marks!, traces: traces! }
    })

    expect(local).toBeDefined()
    expect(captured[0].aggregates).toBe(local!.aggregates)
    expect(captured[0].marks).toBe(local!.marks)
    expect(captured[0].traces).toBe(local!.traces)

    bus.setReporter(() => { throw new Error('boom') })
    bus.start(2)
    expect(() => bus.end(3)).not.toThrow()
  })

  it('isRecording 反映窗口状态', () => {
    expect(bus.isRecording()).toBe(false)
    bus.start(0)
    expect(bus.isRecording()).toBe(true)
    bus.end(1)
    expect(bus.isRecording()).toBe(false)
  })
})
