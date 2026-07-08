import getRefsMixin from '../../src/platform/builtInMixins/refsMixin.ios'

jest.mock('@mpxjs/api-proxy', () => ({
  createSelectorQuery: jest.fn()
}))

describe('refsMixin for RN', () => {
  test('__selectRef should support multiple ref types', () => {
    const { methods } = getRefsMixin()
    const componentRef = {}
    const nodeRef = {}
    const otherRef = {}
    const target = {
      __refs: {
        '.custom': [
          {
            type: 'component',
            instance: componentRef
          },
          {
            type: 'node',
            instance: nodeRef
          },
          {
            type: 'other',
            instance: otherRef
          }
        ]
      }
    }

    expect(methods.__selectRef.call(target, '.custom', ['node', 'component'])).toBe(componentRef)
    expect(methods.__selectRef.call(target, '.custom', ['node', 'component'], true)).toEqual([componentRef, nodeRef])
    expect(methods.__selectRef.call(target, '.custom', 'all', true)).toEqual([componentRef, nodeRef, otherRef])
  })
})
