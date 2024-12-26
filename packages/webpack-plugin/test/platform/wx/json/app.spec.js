const { compileJson, warnFn, errorFn } = require('../../util')

describe('json should transform app json correct', function () {
  afterEach(() => {
    warnFn.mockClear()
    errorFn.mockClear()
  })

  it('should trans tabbar to ali correct', function () {
    const input = {
      tabBar: {
        color: '#000',
        selectedColor: '#888',
        backgroundColor: '#fff',
        list: [{
          pagePath: 'pages/index/index',
          text: '首页'
        }, {
          pagePath: 'pages/logs/index',
          text: '日志'
        }],
        custom: true,
        position: 'top'
      }
    }
    const output = compileJson(input)
    expect(output).toEqual({
      tabBar: {
        textColor: '#000',
        selectedColor: '#888',
        backgroundColor: '#fff',
        items: [
          {
            pagePath: 'pages/index/index',
            name: '首页'
          },
          {
            pagePath: 'pages/logs/index',
            name: '日志'
          }
        ],
        customize: true
      }
    })
    expect(warnFn).toHaveBeenCalled()
  })

  it('should trans window to ali correct', function () {
    const input = {
      window: {
        navigationBarBackgroundColor: '#ffffff',
        navigationBarTextStyle: 'black',
        navigationBarTitleText: '接口功能演示',
        backgroundColor: '#eeeeee',
        backgroundTextStyle: 'light'
      }
    }
    const output = compileJson(input)
    expect(output).toEqual({
      window: {
        titleBarColor: '#ffffff',
        defaultTitle: '接口功能演示',
        backgroundColor: '#eeeeee'
      }
    })
    expect(warnFn).toHaveBeenCalled()
  })

  it('should remove global components to ali silently', function () {
    const input = {
      usingComponents: {
        'mpx-dialog': '@mpxjs/cube-ui/components/mpx-dialog',
        'mpx-toast': '@mpxjs/cube-ui/components/mpx-toast'
      }
    }
    const output = compileJson(input)
    expect(output).toEqual({
      usingComponents: {
        'mpx-dialog': '@mpxjs/cube-ui/components/mpx-dialog',
        'mpx-toast': '@mpxjs/cube-ui/components/mpx-toast'
      }
    })
    expect(warnFn).not.toHaveBeenCalled()
  })
})
