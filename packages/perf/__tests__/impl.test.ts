import { mark, measure, scope, start, end, setReporter, clearReporter } from '../src/impl'
import type { PerfEvent } from '../src/types'

describe('impl mark / measure / scope', () => {
  let captured: PerfEvent[] = []

  beforeEach(() => {
    captured = []
    setReporter((events) => { captured.push(...events) })
  })

  afterEach(() => {
    clearReporter()
  })

  it('scope 起止生成 measure 事件', () => {
    start()
    const stop = scope('foo')
    stop()
    end()
    expect(captured.length).toBe(1)
    expect(captured[0].type).toBe('measure')
    expect(captured[0].name).toBe('foo')
    expect((captured[0] as any).dur).toBeGreaterThanOrEqual(0)
  })

  it('mark + measure 配对生效，重复 measure 同一个 name 失效', () => {
    start()
    mark('m')
    measure('done', 'm')
    measure('done2', 'm') // 第二次应失效（marks.delete 后查不到）
    end()
    const measures = captured.filter(e => e.type === 'measure')
    expect(measures.length).toBe(1)
    expect(measures[0].name).toBe('done')
  })

  it('未 start 时 push 直接丢弃', () => {
    const stop = scope('lost')
    stop()
    end() // 未 start 直接 end，noop
    expect(captured.length).toBe(0)
  })

  it('end 支持传入局部 reporter', () => {
    const local: PerfEvent[] = []
    start()
    const stop = scope('foo')
    stop()
    end((events) => { local.push(...events) })
    expect(captured.length).toBe(1)
    expect(local.length).toBe(1)
    expect(local[0].name).toBe('foo')
  })
})
