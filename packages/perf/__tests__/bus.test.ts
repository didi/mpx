import { bus } from '../src/bus'
import type { AggResult, MarkTimeline } from '../src/types'

interface Captured {
  measures: Map<string, AggResult>
  timeline: MarkTimeline
}

describe('bus 状态机 + measure 聚合 + mark 时间线', () => {
  let captured: Captured[] = []

  beforeEach(() => {
    captured = []
    bus.setReporter((measures, timeline) => {
      captured.push({ measures, timeline: timeline! })
    })
  })

  afterEach(() => {
    bus.setReporter(undefined)
  })

  it('未 start 时 pushMeasure / pushMark 丢弃，end 是 noop', () => {
    bus.pushMeasure('a', 1)
    bus.pushMark('ready', 1)
    bus.end(2)
    expect(captured.length).toBe(0)
  })

  it('start / pushMeasure / end 完整流程聚合 count/sum/avg/max', () => {
    bus.start(10)
    bus.pushMeasure('a', 1)
    bus.pushMeasure('a', 3)
    bus.pushMeasure('b', 5)
    bus.end(20)
    expect(captured.length).toBe(1)
    const agg = captured[0].measures
    expect(agg.size).toBe(2)
    const a = agg.get('a')!
    expect(a.count).toBe(2)
    expect(a.sum).toBe(4)
    expect(a.avg).toBe(2)
    expect(a.max).toBe(3)
    const b = agg.get('b')!
    expect(b.count).toBe(1)
    expect(b.sum).toBe(5)
    expect(b.avg).toBe(5)
    expect(b.max).toBe(5)
  })

  it('start/end 自动生成时间线边界，显式 mark 保序且同名不合并', () => {
    bus.start(10)
    bus.pushMark('ready', 12)
    bus.pushMark('ready', 13)
    bus.end(20)
    expect(captured[0].timeline).toEqual({
      events: [
        { name: 'start', at: 0 },
        { name: 'ready', at: 2 },
        { name: 'ready', at: 3 },
        { name: 'end', at: 10 }
      ],
      dropped: 0
    })
  })

  it('重复 start 幂等，沿用已有窗口和时间线起点', () => {
    bus.start(10)
    bus.pushMeasure('a', 1)
    bus.pushMark('first', 11)
    bus.start(100)
    bus.pushMeasure('a', 2)
    bus.pushMark('second', 12)
    bus.end(20)
    const result = captured[0]
    expect(result.measures.get('a')).toMatchObject({ count: 2, sum: 3 })
    expect(result.timeline.events).toEqual([
      { name: 'start', at: 0 },
      { name: 'first', at: 1 },
      { name: 'second', at: 2 },
      { name: 'end', at: 10 }
    ])
  })

  it('end → start 重新开窗口会清空 measure 和 timeline', () => {
    bus.start(0)
    bus.pushMeasure('a', 1)
    bus.pushMark('first', 1)
    bus.end(2)
    bus.start(10)
    bus.pushMeasure('b', 2)
    bus.pushMark('second', 11)
    bus.end(12)
    expect(captured.length).toBe(2)
    expect(captured[0].measures.has('a')).toBe(true)
    expect(captured[0].measures.has('b')).toBe(false)
    expect(captured[1].measures.has('a')).toBe(false)
    expect(captured[1].measures.has('b')).toBe(true)
    expect(captured[0].timeline.events[1].name).toBe('first')
    expect(captured[1].timeline.events[1].name).toBe('second')
  })

  it('无显式 mark 和 measure 的窗口仍以 start/end 触发 reporter', () => {
    bus.start(10)
    bus.end(15)
    expect(captured[0].measures.size).toBe(0)
    expect(captured[0].timeline).toEqual({
      events: [{ name: 'start', at: 0 }, { name: 'end', at: 5 }],
      dropped: 0
    })
  })

  it('时间线总量固定为 256，保留前 254 个显式 mark 和末尾 end', () => {
    bus.start(0)
    Array.from({ length: 260 }).forEach((_, index) => {
      bus.pushMark(`mark-${index}`, index + 1)
    })
    bus.end(300)
    const timeline = captured[0].timeline
    expect(timeline.events.length).toBe(256)
    expect(timeline.events[0]).toEqual({ name: 'start', at: 0 })
    expect(timeline.events[254]).toEqual({ name: 'mark-253', at: 254 })
    expect(timeline.events[255]).toEqual({ name: 'end', at: 300 })
    expect(timeline.dropped).toBe(6)
  })

  it('reporter 抛错被吞，不影响 end 返回', () => {
    bus.setReporter(() => { throw new Error('boom') })
    bus.start(0)
    bus.pushMeasure('a', 1)
    expect(() => bus.end(1)).not.toThrow()
  })

  it('clearReporter 后 end 静默丢弃', () => {
    bus.setReporter(undefined)
    bus.start(0)
    bus.pushMeasure('a', 1)
    expect(() => bus.end(1)).not.toThrow()
  })

  it('全局与局部 reporter 同批触发同一份 Map 和 timeline', () => {
    let local: Captured | undefined
    bus.start(0)
    bus.pushMeasure('a', 1)
    bus.end(1, (measures, timeline) => {
      local = { measures, timeline: timeline! }
    })
    expect(captured.length).toBe(1)
    expect(local).toBeDefined()
    expect(captured[0].measures).toBe(local!.measures)
    expect(captured[0].timeline).toBe(local!.timeline)
  })

  it('全局 reporter 清空后 end 的局部 reporter 仍生效', () => {
    let local: Captured | undefined
    bus.setReporter(undefined)
    bus.start(0)
    bus.pushMeasure('a', 1)
    bus.end(1, (measures, timeline) => {
      local = { measures, timeline: timeline! }
    })
    expect(captured.length).toBe(0)
    expect(local!.measures.get('a')!.count).toBe(1)
    expect(local!.timeline.events.map(event => event.name)).toEqual(['start', 'end'])
  })

  it('isRecording 反映当前窗口状态', () => {
    expect(bus.isRecording()).toBe(false)
    bus.start(0)
    expect(bus.isRecording()).toBe(true)
    bus.end(1)
    expect(bus.isRecording()).toBe(false)
  })
})
