import SelectorQuery from '../../src/platform/api/create-selector-query/rnSelectQuery'

function createNodeRef (id) {
  return {
    getNodeInstance () {
      return {
        nodeRef: {
          current: {}
        },
        props: {
          current: {
            id,
            [`data-${id}`]: id
          }
        },
        instance: {
          style: {}
        }
      }
    }
  }
}

function execQuery (query) {
  return new Promise(resolve => {
    query.exec(resolve)
  })
}

describe('RN createSelectorQuery', () => {
  it('should resolve selected component instance to host node ref', async () => {
    const hostRef = createNodeRef('host')
    const child = {
      __selectRef: jest.fn(() => hostRef),
      getNodeInstance: jest.fn()
    }
    const component = {
      __selectRef: jest.fn(() => child)
    }
    const query = new SelectorQuery().in(component)

    query.select('#card').fields({
      id: true,
      dataset: true
    })
    const res = await execQuery(query)

    expect(component.__selectRef).toHaveBeenCalledWith('#card', 'all', undefined)
    expect(child.__selectRef).toHaveBeenCalledWith('__mpxHost', 'node')
    expect(child.getNodeInstance).not.toHaveBeenCalled()
    expect(res[0]).toEqual({
      id: 'host',
      dataset: {
        host: 'host'
      }
    })
  })

  it('should resolve mixed selectAll refs and skip components without host node', async () => {
    const hostRef = createNodeRef('host')
    const nodeRef = createNodeRef('node')
    const child = {
      __selectRef: jest.fn(() => hostRef)
    }
    const virtualHostChild = {
      __selectRef: jest.fn()
    }
    const component = {
      __selectRef: jest.fn(() => [child, nodeRef, virtualHostChild])
    }
    const query = new SelectorQuery().in(component)

    query.selectAll('.item').fields({
      id: true
    })
    const res = await execQuery(query)

    expect(component.__selectRef).toHaveBeenCalledWith('.item', 'all', true)
    expect(res[0]).toEqual([
      { id: 'host' },
      { id: 'node' }
    ])
  })
})
