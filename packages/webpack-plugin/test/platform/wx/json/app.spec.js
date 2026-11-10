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

  it.each([
    ['custom', { defaultTitle: '', transparentTitle: 'always', titlePenetrate: 'YES' }],
    ['default', { defaultTitle: '全局标题', transparentTitle: 'none', titlePenetrate: 'NO' }]
  ])('should trans window navigationStyle %s to ali', function (navigationStyle, window) {
    expect(compileJson({ window: { navigationStyle, navigationBarTitleText: '全局标题' } })).toEqual({ window })
    expect(warnFn).not.toHaveBeenCalled()
    expect(errorFn).not.toHaveBeenCalled()
  })

  it.each([
    ['custom', {}, { defaultTitle: '', transparentTitle: 'always', titlePenetrate: 'YES' }],
    ['custom', { navigationStyle: 'default', navigationBarTitleText: '页面标题' }, { defaultTitle: '页面标题', transparentTitle: 'none', titlePenetrate: 'NO' }],
    ['default', { navigationStyle: 'custom' }, { defaultTitle: '', transparentTitle: 'always', titlePenetrate: 'YES' }],
    ['custom', { navigationBarTitleText: '页面标题' }, { defaultTitle: '页面标题', transparentTitle: 'always', titlePenetrate: 'YES' }],
    ['custom', { navigationStyle: 'default' }, { defaultTitle: '', transparentTitle: 'none', titlePenetrate: 'NO' }]
  ])('should apply page field overrides to ali window %s: %j', function (navigationStyle, page, expected) {
    const app = compileJson({ window: { navigationStyle, navigationBarTitleText: '全局标题' } })
    expect(Object.assign({}, app.window, compileJson(page, { type: 'page' }))).toEqual(expected)
    expect(warnFn).not.toHaveBeenCalled()
    expect(errorFn).not.toHaveBeenCalled()
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

  it('should keep supported app json when trans to rn', function () {
    const input = {
      pages: ['pages/index'],
      packages: ['./packageA/app.mpx?root=packageA'],
      subPackages: [{
        root: 'packageB',
        pages: ['pages/list']
      }],
      window: {
        navigationBarTitleText: '首页',
        navigationBarTextStyle: 'black',
        navigationBarBackgroundColor: '#ffffff',
        navigationStyle: 'default',
        backgroundColorContent: '#f5f5f5'
      },
      usingComponents: {
        'app-card': './components/app-card'
      },
      networkTimeout: {
        request: 60000
      },
      preloadRule: {
        'pages/index': {
          network: 'all',
          packages: ['packageA']
        }
      },
      entryPagePath: 'pages/index'
    }
    const output = compileJson(input, {
      mode: 'ios'
    })
    expect(output).toEqual({
      pages: ['pages/index'],
      packages: ['./packageA/app.mpx?root=packageA'],
      subPackages: [{
        root: 'packageB',
        pages: ['pages/list']
      }],
      window: {
        navigationBarTitleText: '首页',
        navigationBarTextStyle: 'black',
        navigationBarBackgroundColor: '#ffffff',
        navigationStyle: 'default',
        backgroundColorContent: '#f5f5f5'
      },
      usingComponents: {
        'app-card': './components/app-card'
      },
      networkTimeout: {
        request: 60000
      },
      preloadRule: {
        'pages/index': {
          network: 'all',
          packages: ['packageA']
        }
      },
      entryPagePath: 'pages/index'
    })
    expect(warnFn).not.toHaveBeenCalled()
    expect(errorFn).not.toHaveBeenCalled()
  })

  it('should error and remove unsupported app json when trans to rn', function () {
    const input = {
      pages: ['pages/index'],
      tabBar: {
        color: '#000',
        selectedColor: '#888',
        backgroundColor: '#fff',
        list: [{
          pagePath: 'pages/index',
          text: '首页'
        }]
      },
      plugins: {
        myPlugin: {
          version: '1.0.0',
          provider: 'wxid'
        }
      },
      functionalPages: true,
      workers: 'workers',
      requiredBackgroundModes: ['audio'],
      debug: true,
      resizable: true,
      navigateToMiniProgramAppIdList: ['wxid']
    }
    const output = compileJson(input, {
      mode: 'android'
    })
    expect(output).toEqual({
      pages: ['pages/index']
    })
    expect(errorFn).toHaveBeenCalledTimes(3)
    expect(warnFn).toHaveBeenCalledTimes(5)
  })
})
