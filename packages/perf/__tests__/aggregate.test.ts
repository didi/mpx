import { aggregateByName } from '../src/aggregate'
import type { PerfEvent } from '../src/types'

describe('aggregateByName', () => {
  it('忽略 mark 事件，仅聚合 measure', () => {
    const events: PerfEvent[] = [
      { type: 'mark', name: 'a', ts: 0 },
      { type: 'measure', name: 'a', start: 0, dur: 1 },
      { type: 'measure', name: 'a', start: 0, dur: 3 },
      { type: 'measure', name: 'b', start: 0, dur: 5 }
    ]
    const agg = aggregateByName(events)
    const a = agg.get('a')!
    expect(a.count).toBe(2)
    expect(a.sum).toBe(4)
    expect(a.avg).toBe(2)
    expect(a.max).toBe(3)
    expect(agg.get('b')!.max).toBe(5)
  })

  it('空数组返回空 Map', () => {
    expect(aggregateByName([]).size).toBe(0)
  })
})
