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

  it('should keep supported page json when trans to rn', function () {
    const input = {
      navigationBarTitleText: '首页',
      navigationBarTextStyle: 'white',
      navigationBarBackgroundColor: '#000000',
      navigationStyle: 'custom',
      backgroundColorContent: '#f5f5f5',
      disableScroll: true,
      disableKeyboardAvoiding: true,
      usingComponents: {
        'my-list': './list'
      },
      componentPlaceholder: {
        'async-list': 'my-list'
      }
    }
    const output = compileJson(input, {
      type: 'page',
      mode: 'ios'
    })
    expect(output).toEqual({
      navigationBarTitleText: '首页',
      navigationBarTextStyle: 'white',
      navigationBarBackgroundColor: '#000000',
      navigationStyle: 'custom',
      backgroundColorContent: '#f5f5f5',
      disableScroll: true,
      disableKeyboardAvoiding: true,
      usingComponents: {
        'my-list': './list'
      },
      componentPlaceholder: {
        'async-list': 'my-list'
      }
    })
    expect(warnFn).not.toHaveBeenCalled()
    expect(errorFn).not.toHaveBeenCalled()
  })

  it('should warn and remove unsupported page json when trans to rn', function () {
    const input = {
      navigationBarTitleText: '首页',
      backgroundColor: '#eeeeee',
      backgroundTextStyle: 'light',
      backgroundColorTop: '#ffffff',
      backgroundColorBottom: '#000000',
      enablePullDownRefresh: true,
      onReachBottomDistance: 100,
      pageOrientation: 'landscape'
    }
    const output = compileJson(input, {
      type: 'page',
      mode: 'harmony'
    })
    expect(output).toEqual({
      navigationBarTitleText: '首页'
    })
    expect(warnFn).toHaveBeenCalledTimes(7)
    expect(errorFn).not.toHaveBeenCalled()
  })
})
