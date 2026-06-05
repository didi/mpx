import { scopeStart, scopeEnd, mark, measure, start, end, setReporter, clearReporter } from '../src/impl'
import type { AggResult } from '../src/types'

describe('impl scopeStart/scopeEnd / mark / measure', () => {
  let captured: Map<string, AggResult> | null = null

  beforeEach(() => {
    captured = null
    setReporter((agg) => { captured = agg })
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
    end() // 未 start 直接 end 也是 noop
    expect(captured).toBeNull()
  })

  it('scopeEnd 重复调用同一 id 不重复累加', () => {
    start()
    const id = scopeStart('foo')
    scopeEnd(id)
    scopeEnd(id) // 重复，应被忽略
    end()
    expect(captured!.get('foo')!.count).toBe(1)
  })

  it('mark + measure 配对进聚合', () => {
    start()
    mark('m')
    measure('done', 'm')
    end()
    const done = captured!.get('done')!
    expect(done.count).toBe(1)
    expect(done.sum).toBeGreaterThanOrEqual(0)
  })

  it('measure 同一个 mark 第二次失效（mark 用过即清）', () => {
    start()
    mark('m')
    measure('done', 'm')
    measure('done2', 'm') // 已被 delete，应失效
    end()
    expect(captured!.has('done')).toBe(true)
    expect(captured!.has('done2')).toBe(false)
  })

  it('mark 单独不进聚合', () => {
    start()
    mark('m')
    end()
    expect(captured).toBeNull() // aggMap 为空 → end 不触发 reporter
  })

  it('end 支持局部 reporter，与全局 reporter 同批触发', () => {
    let local: Map<string, AggResult> | null = null
    start()
    const id = scopeStart('foo'); scopeEnd(id)
    end((agg) => { local = agg })
    expect(captured).not.toBeNull()
    expect(local).not.toBeNull()
    expect(captured).toBe(local) // 同一份 Map
  })
})
