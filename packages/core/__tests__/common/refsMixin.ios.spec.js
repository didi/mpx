import getRefsMixin from '../../src/platform/builtInMixins/refsMixin.ios'

jest.mock('@mpxjs/api-proxy', () => ({
  createSelectorQuery: jest.fn()
}))

describe('RN refsMixin', () => {
  it('should select refs by all type without breaking type-specific selection', () => {
    const nodeA = { id: 'nodeA' }
    const nodeB = { id: 'nodeB' }
    const componentA = { id: 'componentA' }
    const ctx = {
      __refs: {
        '.a': [
          { type: 'node', instance: nodeA },
          { type: 'component', instance: componentA },
          { type: 'node', instance: nodeB }
        ],
        '.b': [
          { type: 'component', instance: componentA },
          { type: 'node', instance: nodeB }
        ]
      }
    }
    const { __selectRef } = getRefsMixin().methods

    expect(__selectRef.call(ctx, '.a.b', 'all', true)).toEqual([componentA, nodeB])
    expect(__selectRef.call(ctx, '.a.b', 'component')).toBe(componentA)
    expect(__selectRef.call(ctx, '.a.b', 'node')).toBe(nodeB)
  })
})
