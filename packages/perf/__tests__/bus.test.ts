import { bus } from '../src/bus'
import type { AggResult } from '../src/types'

describe('bus 状态机 + 实时聚合', () => {
  let captured: Map<string, AggResult>[] = []

  beforeEach(() => {
    captured = []
    bus.setReporter((agg) => { captured.push(agg) })
  })

  afterEach(() => {
    bus.setReporter(undefined)
  })

  it('未 start 时 pushMeasure 立即丢弃', () => {
    bus.pushMeasure('a', 1)
    bus.end()
    expect(captured.length).toBe(0)
  })

  it('start / pushMeasure / end 完整流程聚合 count/sum/avg/max', () => {
    bus.start()
    bus.pushMeasure('a', 1)
    bus.pushMeasure('a', 3)
    bus.pushMeasure('b', 5)
    bus.end()
    expect(captured.length).toBe(1)
    const agg = captured[0]
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

  it('重复 start 幂等，沿用已有窗口', () => {
    bus.start()
    bus.pushMeasure('a', 1)
    bus.start() // 幂等，不清空
    bus.pushMeasure('a', 2)
    bus.end()
    const a = captured[0].get('a')!
    expect(a.count).toBe(2)
    expect(a.sum).toBe(3)
  })

  it('end → start 重新开窗口会清空', () => {
    bus.start()
    bus.pushMeasure('a', 1)
    bus.end()
    bus.start()
    bus.pushMeasure('b', 2)
    bus.end()
    expect(captured.length).toBe(2)
    expect(captured[0].has('a')).toBe(true)
    expect(captured[0].has('b')).toBe(false)
    expect(captured[1].has('a')).toBe(false)
    expect(captured[1].has('b')).toBe(true)
  })

  it('未 start 直接 end 是 noop', () => {
    bus.end()
    expect(captured.length).toBe(0)
  })

  it('窗口内无样本时 end 不触发 reporter', () => {
    bus.start()
    bus.end()
    expect(captured.length).toBe(0)
  })

  it('reporter 抛错被吞，不影响 end 返回', () => {
    bus.setReporter(() => { throw new Error('boom') })
    bus.start()
    bus.pushMeasure('a', 1)
    expect(() => bus.end()).not.toThrow()
  })

  it('clearReporter 后 end 静默丢弃', () => {
    bus.setReporter(undefined)
    bus.start()
    bus.pushMeasure('a', 1)
    expect(() => bus.end()).not.toThrow()
  })

  it('end 支持局部 reporter，与全局 reporter 同批触发同一份 Map', () => {
    const local: Map<string, AggResult>[] = []
    bus.start()
    bus.pushMeasure('a', 1)
    bus.end((agg) => { local.push(agg) })
    expect(captured.length).toBe(1)
    expect(local.length).toBe(1)
    // 两者引用同一份 Map（reporter 不应修改它）
    expect(captured[0]).toBe(local[0])
  })

  it('全局 reporter 清空后 end 的局部 reporter 仍生效', () => {
    const local: Map<string, AggResult>[] = []
    bus.setReporter(undefined)
    bus.start()
    bus.pushMeasure('a', 1)
    bus.end((agg) => { local.push(agg) })
    expect(captured.length).toBe(0)
    expect(local.length).toBe(1)
    expect(local[0].get('a')!.count).toBe(1)
  })

  it('isRecording 反映当前窗口状态', () => {
    expect(bus.isRecording()).toBe(false)
    bus.start()
    expect(bus.isRecording()).toBe(true)
    bus.end()
    expect(bus.isRecording()).toBe(false)
  })
})
