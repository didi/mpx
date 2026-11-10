import {
  aggrEnd,
  aggrStart,
  clearReporter,
  end,
  mark,
  measureEnd,
  measureStart,
  scopeEnd,
  scopeStart,
  setReporter,
  start,
  traceEnd,
  traceStart
} from '../src/impl'
import type {
  AggrResult,
  MarkTimeline,
  TraceTimeline
} from '../src/types'

describe('impl 三类统计 API', () => {
  let aggregates: Map<string, AggrResult> | null = null
  let marks: MarkTimeline | null = null
  let traces: TraceTimeline | null = null
  let nowSpy: jest.SpyInstance<number, []>

  beforeEach(() => {
    aggregates = null
    marks = null
    traces = null
    nowSpy = jest.spyOn(performance, 'now')
    setReporter((result, markTimeline, traceTimeline) => {
      aggregates = result
      marks = markTimeline!
      traces = traceTimeline!
    })
  })

  afterEach(() => {
    end()
    clearReporter()
    nowSpy.mockRestore()
  })

  function mockNow (...values: number[]) {
    let index = 0
    nowSpy.mockImplementation(() => values[Math.min(index++, values.length - 1)])
  }

  it('aggr id 模式支持同名并发、乱序结束和正确聚合', () => {
    mockNow(0, 1, 2, 5, 7, 8)
    start()
    const first = aggrStart('foo')
    const second = aggrStart('foo')
    aggrEnd(first)
    aggrEnd(second)
    end()

    expect(aggregates!.get('foo')).toEqual({
      count: 2,
      sum: 9,
      avg: 4.5,
      max: 5
    })
  })

  it('aggr name 模式由后一次 start 覆盖，并消费起点', () => {
    mockNow(0, 1, 4, 9, 10)
    start()
    expect(aggrStart('request', true)).toBeUndefined()
    aggrStart('request', true)
    aggrEnd('request')
    aggrEnd('request')
    end()

    expect(aggregates!.get('request')).toEqual({
      count: 1,
      sum: 5,
      avg: 5,
      max: 5
    })
  })

  it('aggr name 模式允许窗口外保存起点', () => {
    mockNow(1, 2, 5, 6)
    aggrStart('request', true)
    start()
    aggrEnd('request')
    end()
    expect(aggregates!.get('request')!.sum).toBe(4)
  })

  it('无效、缺失和重复的 aggrEnd 安全 noop', () => {
    mockNow(0, 1, 2, 3)
    start()
    const id = aggrStart('foo')
    aggrEnd(-1)
    aggrEnd(999)
    aggrEnd('missing')
    aggrEnd(id)
    aggrEnd(id)
    end()
    expect(aggregates!.get('foo')!.count).toBe(1)
  })

  it('旧 scope/measure API 复用聚合语义', () => {
    mockNow(0, 1, 3, 4, 7, 8)
    start()
    const id = scopeStart('scope')
    scopeEnd(id)
    measureStart('measure')
    measureEnd('measure')
    end()
    expect(aggregates!.get('scope')!.sum).toBe(2)
    expect(aggregates!.get('measure')!.sum).toBe(3)
  })

  it('未录制时 aggr/trace id 和 mark 不读取时钟', () => {
    expect(aggrStart('aggr')).toBe(-1)
    expect(traceStart('trace')).toBe(-1)
    expect(traceStart('trace-name', true)).toBeUndefined()
    mark('lost')
    expect(nowSpy).not.toHaveBeenCalled()
  })

  it('mark 和 trace 超出容量时不读取时钟', () => {
    mockNow(0)
    start({ markLimit: 2, traceLimit: 0 })
    nowSpy.mockClear()

    mark('dropped')
    expect(traceStart('dropped')).toBe(-1)

    expect(nowSpy).not.toHaveBeenCalled()
  })

  it('trace id 模式保存 start/timestamp/duration/info 并保持 start 顺序', () => {
    const info = { moduleId: 1 }
    mockNow(100, 101, 102, 105, 110, 111)
    start()
    const parent = traceStart('parent')
    const child = traceStart('child')
    traceEnd(child)
    traceEnd(parent, info)
    end()

    expect(traces).toEqual({
      events: [
        { name: 'parent', start: 1, timestamp: 101, duration: 9, info },
        { name: 'child', start: 2, timestamp: 102, duration: 3 }
      ],
      dropped: 0,
      incomplete: 0
    })
    expect(Object.prototype.hasOwnProperty.call(traces!.events[1], 'info')).toBe(false)
  })

  it('trace name 模式覆盖旧起点并统计 incomplete', () => {
    mockNow(0, 1, 2, 3, 4, 5)
    start()
    traceStart('request', true)
    traceStart('request', true)
    traceEnd('request')
    traceStart('hanging', true)
    end()

    expect(traces).toEqual({
      events: [
        { name: 'request', start: 2, timestamp: 2, duration: 1 }
      ],
      dropped: 0,
      incomplete: 2
    })
  })

  it('trace 重复 end 只完成一次', () => {
    mockNow(0, 1, 3, 4)
    start()
    const id = traceStart('task')
    traceEnd(id)
    traceEnd(id)
    end()
    expect(traces!.events).toEqual([
      { name: 'task', start: 1, timestamp: 1, duration: 2 }
    ])
  })

  it('trace 自定义容量生效，溢出 id 返回 -1', () => {
    mockNow(0, 1, 2, 3, 4)
    start({ traceLimit: 1 })
    const accepted = traceStart('accepted')
    expect(traceStart('dropped')).toBe(-1)
    traceEnd(accepted)
    end()
    expect(traces!.events).toHaveLength(1)
    expect(traces!.dropped).toBe(1)
  })

  it('上一窗口遗留 id 不能结束下一窗口事件', () => {
    mockNow(0, 1, 2, 10, 11, 12, 13)
    start()
    const stale = traceStart('stale')
    end()

    start()
    const current = traceStart('current')
    traceEnd(stale)
    traceEnd(current)
    end()

    expect(traces).toEqual({
      events: [
        { name: 'current', start: 1, timestamp: 11, duration: 1 }
      ],
      dropped: 0,
      incomplete: 0
    })
  })

  it('mark 保存 info，start/end 边界不携带 info', () => {
    const info = { source: 'cache' }
    mockNow(10, 12, 20)
    start({ markLimit: 3 })
    mark('ready', info)
    mark('dropped', { ignored: true })
    end()

    expect(marks).toEqual({
      events: [
        { name: 'start', start: 0, timestamp: 10 },
        { name: 'ready', start: 2, timestamp: 12, info },
        { name: 'end', start: 10, timestamp: 20 }
      ],
      dropped: 1
    })
  })

  it('全局与局部 reporter 共享三类结果引用', () => {
    let localAggregates: Map<string, AggrResult> | undefined
    let localMarks: MarkTimeline | undefined
    let localTraces: TraceTimeline | undefined
    mockNow(0, 1)
    start()
    end((result, markTimeline, traceTimeline) => {
      localAggregates = result
      localMarks = markTimeline
      localTraces = traceTimeline
    })

    expect(aggregates).toBe(localAggregates)
    expect(marks).toBe(localMarks)
    expect(traces).toBe(localTraces)
  })
})
