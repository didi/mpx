
import { reactive } from '../src/reactive'
import { computed } from '../src/computed'

describe('reactivity/computed', () => {
  it('should return updated value', () => {
    const value = reactive({})
    const cValue = computed(() => value.foo)
    expect(cValue.value).toBe(undefined)
    value.foo = 1
    expect(cValue.value).toBe(1)
  })
})
