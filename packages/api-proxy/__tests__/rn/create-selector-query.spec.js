import SelectorQuery from '../../src/platform/api/create-selector-query/rnSelectQuery'

describe('createSelectorQuery for RN', () => {
  test('select should support custom component refs', (done) => {
    const componentRef = {
      __getNodeInstance () {
        return {
          nodeRef: {
            current: true
          },
          props: {
            current: {}
          },
          instance: {
            ref: 'custom-component-ref'
          }
        }
      }
    }
    const component = {
      __selectRef: jest.fn(() => componentRef)
    }
    const query = new SelectorQuery()

    query.in(component).select('.custom').ref()
    query.exec((res) => {
      expect(component.__selectRef).toHaveBeenCalledWith('.custom', 'all', undefined)
      expect(res).toEqual([{ ref: 'custom-component-ref' }])
      done()
    })
  })

  test('select should support custom component refs by id', (done) => {
    const componentRef = {
      __getNodeInstance () {
        return {
          nodeRef: {
            current: true
          },
          props: {
            current: {}
          },
          instance: {
            ref: 'custom-component-ref'
          }
        }
      }
    }
    const component = {
      __selectRef: jest.fn(() => componentRef)
    }
    const query = new SelectorQuery()

    query.in(component).select('#custom').ref()
    query.exec((res) => {
      expect(component.__selectRef).toHaveBeenCalledWith('#custom', 'all', undefined)
      expect(res).toEqual([{ ref: 'custom-component-ref' }])
      done()
    })
  })

  test('selectAll should support custom component refs', (done) => {
    const componentRefs = ['custom-component-ref-1', 'custom-component-ref-2'].map(ref => ({
      __getNodeInstance () {
        return {
          nodeRef: {
            current: true
          },
          props: {
            current: {}
          },
          instance: {
            ref
          }
        }
      }
    }))
    const component = {
      __selectRef: jest.fn(() => componentRefs)
    }
    const query = new SelectorQuery()

    query.in(component).selectAll('.custom').ref()
    query.exec((res) => {
      expect(component.__selectRef).toHaveBeenCalledWith('.custom', 'all', true)
      expect(res).toEqual([[{ ref: 'custom-component-ref-1' }, { ref: 'custom-component-ref-2' }]])
      done()
    })
  })
})
