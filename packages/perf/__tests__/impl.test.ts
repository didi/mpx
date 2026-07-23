import {
  scopeStart,
  scopeEnd,
  mark,
  measureStart,
  measureEnd,
  start,
  end,
  setReporter,
  clearReporter
} from '../src/impl'
import type { AggResult, MarkTimeline } from '../src/types'

describe('impl scope / measure / mark', () => {
  let captured: Map<string, AggResult> | null = null
  let timeline: MarkTimeline | null = null

  beforeEach(() => {
    captured = null
    timeline = null
    setReporter((measures, marks) => {
      captured = measures
      timeline = marks!
    })
  })

  afterEach(() => {
    clearReporter()
  })

  it('scopeStart/scopeEnd 起止生成一条 measure 样本', () => {
    start()
    const id = scopeStart('foo')
    expect(id).toBeGreaterThanOrEqual(0)
    scopeEnd(id)
    end()
    expect(captured).not.toBeNull()
    const foo = captured!.get('foo')!
    expect(foo.count).toBe(1)
    expect(foo.sum).toBeGreaterThanOrEqual(0)
    expect(foo.max).toBe(foo.sum)
    expect(foo.avg).toBe(foo.sum)
  })

  it('同名 scope 多次累加，count/sum/avg/max 正确', () => {
    start()
    const a = scopeStart('foo'); scopeEnd(a)
    const b = scopeStart('foo'); scopeEnd(b)
    const c = scopeStart('foo'); scopeEnd(c)
    end()
    const foo = captured!.get('foo')!
    expect(foo.count).toBe(3)
    expect(foo.avg).toBeCloseTo(foo.sum / 3, 10)
  })

  it('嵌套 scope 不串台，freeList 正确回收', () => {
    start()
    const outer = scopeStart('outer')
    const inner = scopeStart('inner')
    scopeEnd(inner)
    scopeEnd(outer)
    end()
    expect(captured!.get('outer')!.count).toBe(1)
    expect(captured!.get('inner')!.count).toBe(1)
  })

  it('未 start 时 scopeStart 返回 -1，scopeEnd(-1) 安全 noop', () => {
    const id = scopeStart('lost')
    expect(id).toBe(-1)
    expect(() => scopeEnd(id)).not.toThrow()
    end()
    expect(captured).toBeNull()
  })

  it('scopeEnd 重复调用同一 id 不重复累加', () => {
    start()
    const id = scopeStart('foo')
    scopeEnd(id)
    scopeEnd(id)
    end()
    expect(captured!.get('foo')!.count).toBe(1)
  })

  it('measureStart/measureEnd 使用同名 key 配对并聚合', () => {
    start()
    measureStart('request')
    measureEnd('request')
    end()
    const request = captured!.get('request')!
    expect(request.count).toBe(1)
    expect(request.sum).toBeGreaterThanOrEqual(0)
  })

  it('measureEnd 消费起点后重复调用不再聚合', () => {
    start()
    measureStart('request')
    measureEnd('request')
    measureEnd('request')
    end()
    expect(captured!.get('request')!.count).toBe(1)
  })

  it('mark 只写入有序时间线，同名事件不合并', () => {
    start()
    mark('ready')
    mark('ready')
    end()
    expect(captured!.size).toBe(0)
    expect(timeline!.events.map(event => event.name)).toEqual(['start', 'ready', 'ready', 'end'])
  })

  it('mark 不会注册 measure 起点', () => {
    start()
    mark('request')
    measureEnd('request')
    end()
    expect(captured!.has('request')).toBe(false)
    expect(timeline!.events.map(event => event.name)).toEqual(['start', 'request', 'end'])
  })

  it('未录制时 mark 被丢弃，start/end 仍自动生成边界', () => {
    mark('lost')
    start()
    end()
    expect(timeline!.events.map(event => event.name)).toEqual(['start', 'end'])
  })

  it('end 支持局部 reporter，与全局 reporter 共享结果', () => {
    let localMeasures: Map<string, AggResult> | undefined
    let localTimeline: MarkTimeline | undefined
    start()
    const id = scopeStart('foo'); scopeEnd(id)
    end((measures, marks) => {
      localMeasures = measures
      localTimeline = marks
    })
    expect(captured).toBe(localMeasures)
    expect(timeline).toBe(localTimeline)
  })
})
