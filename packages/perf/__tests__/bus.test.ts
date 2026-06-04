import { bus } from '../src/bus'
import type { PerfEvent } from '../src/types'

describe('bus 状态机', () => {
  let captured: PerfEvent[][] = []

  beforeEach(() => {
    captured = []
    bus.setReporter((events) => { captured.push(events) })
  })

  afterEach(() => {
    bus.setReporter(undefined)
  })

  it('未 start 时 push 立即丢弃', () => {
    bus.push({ type: 'measure', name: 'a', start: 0, dur: 1 })
    bus.end()
    expect(captured.length).toBe(0)
  })

  it('start / push / end 完整流程', () => {
    bus.start()
    bus.push({ type: 'measure', name: 'a', start: 0, dur: 1 })
    bus.push({ type: 'measure', name: 'b', start: 0, dur: 2 })
    bus.end()
    expect(captured.length).toBe(1)
    expect(captured[0].length).toBe(2)
  })

  it('重复 start 幂等，沿用窗口', () => {
    bus.start()
    bus.push({ type: 'measure', name: 'a', start: 0, dur: 1 })
    bus.start() // 幂等，不清空
    bus.push({ type: 'measure', name: 'b', start: 0, dur: 2 })
    bus.end()
    expect(captured[0].length).toBe(2)
  })

  it('end → start 重新开窗口会清空', () => {
    bus.start()
    bus.push({ type: 'measure', name: 'a', start: 0, dur: 1 })
    bus.end()
    bus.start()
    bus.push({ type: 'measure', name: 'b', start: 0, dur: 2 })
    bus.end()
    expect(captured.length).toBe(2)
    expect(captured[0][0].name).toBe('a')
    expect(captured[1][0].name).toBe('b')
  })

  it('未 start 直接 end 是 noop', () => {
    bus.end()
    expect(captured.length).toBe(0)
  })

  it('reporter 抛错被吞，不影响后续', () => {
    bus.setReporter(() => { throw new Error('boom') })
    bus.start()
    bus.push({ type: 'measure', name: 'a', start: 0, dur: 1 })
    expect(() => bus.end()).not.toThrow()
  })

  it('clearReporter 后 end 静默丢弃', () => {
    bus.setReporter(undefined)
    bus.start()
    bus.push({ type: 'measure', name: 'a', start: 0, dur: 1 })
    expect(() => bus.end()).not.toThrow()
  })

  it('QUEUE_LIMIT FIFO 兜底', () => {
    bus.setReporter((events) => { captured.push(events) })
    bus.start()
    for (let i = 0; i < 5000; i++) {
      bus.push({ type: 'measure', name: 'x', start: 0, dur: i })
    }
    bus.end()
    // 队列长度被裁剪到 4096
    expect(captured[0].length).toBe(4096)
    // FIFO：最旧的（dur=0..903）被裁掉，最新的留下
    expect((captured[0][captured[0].length - 1] as any).dur).toBe(4999)
  })
})
