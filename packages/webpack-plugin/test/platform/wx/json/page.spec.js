const { compileJson, warnFn, errorFn } = require('../../util')

describe('json should transform page json correct', function () {
  afterEach(() => {
    warnFn.mockClear()
    errorFn.mockClear()
  })

  it('should trans page json to ali correct', function () {
    const input = {
      navigationBarBackgroundColor: '#ffffff',
      navigationBarTextStyle: 'black',
      navigationBarTitleText: '接口功能演示',
      backgroundColor: '#eeeeee',
      backgroundTextStyle: 'light'
    }
    const output = compileJson(input, {
      type: 'page'
    })
    expect(output).toEqual({
      titleBarColor: '#ffffff',
      defaultTitle: '接口功能演示',
      backgroundColor: '#eeeeee'
    })
    expect(warnFn).toHaveBeenCalled()
  })

  it('should add globalComponent in component json when trans to ali', function () {
    const input = {
      usingComponents: {
        'my-list': './list'
      }
    }
    const output = compileJson(input, {
      type: 'page',
      globalComponents: {
        'mpx-dialog': '@mpxjs/cube-ui/components/mpx-dialog',
        'mpx-toast': '@mpxjs/cube-ui/components/mpx-toast'
      }
    })
    expect(output).toEqual({
      usingComponents: {
        'my-list': './list'
      }
    })
    expect(warnFn).not.toHaveBeenCalled()
  })

  it('should trans hump-style component\'s name to dashed-style when trans to ali', function () {
    const input = {
      usingComponents: {
        myList: './list?root=otherPack',
        simpleList: './simpleList'
      },
      componentPlaceholder: {
        myList: 'simpleList'
      }
    }
    const output = compileJson(input, {
      type: 'page'
    })

    expect(output).toEqual({
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
