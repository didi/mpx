const { compileJson, warnFn, errorFn } = require('../../util')

describe('json should transform component json correct', function () {
  afterEach(() => {
    warnFn.mockClear()
    errorFn.mockClear()
  })

  it('should add globalComponent in component json when trans to ali', function () {
    const input = {
      component: true,
      usingComponents: {
        'my-list': './list'
      }
    }
    const output = compileJson(input, {
      type: 'component',
      globalComponents: {
        'mpx-dialog': '@mpxjs/cube-ui/components/mpx-dialog',
        'mpx-toast': '@mpxjs/cube-ui/components/mpx-toast'
      }
    })
    expect(output).toEqual({
      component: true,
      usingComponents: {
        'my-list': './list'
      }
    })
    expect(warnFn).not.toHaveBeenCalled()
  })

  it('should trans hump-style component\'s name to dashed-style when trans to ali', function () {
    const input = {
      component: true,
      usingComponents: {
        myList: './list?root=otherPack',
        simpleList: './simpleList'
      },
      componentPlaceholder: {
        myList: 'simpleList'
      }
    }
    const output = compileJson(input, {
      type: 'component'
    })

    expect(output).toEqual({
      component: true,
      usingComponents: {
        'my-list': './list?root=otherPack',
        'simple-list': './simpleList'
      },
      componentPlaceholder: {
        'my-list': 'simple-list'
      }
    })
    expect(warnFn).not.toHaveBeenCalled()
  })
})
