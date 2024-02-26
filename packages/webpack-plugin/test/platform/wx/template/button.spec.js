const { compileTemplate, warnFn, errorFn } = require('../../util')

describe('template should transform correct', function () {
  afterEach(() => {
    warnFn.mockClear()
    errorFn.mockClear()
  })

  it('should warning if button\'s open-type is a variable', function () {
    const input = '<button open-type="{{ aaa }}" bindTap="handleClick"></button>'
    compileTemplate(input)
    expect(warnFn).toHaveBeenCalledWith('<button>\'s property \'open-type\' does not support \'[{{ aaa }}]\' value in ali environment!')
  })

  it('should transform button correct', function () {
    const input1 = '<button open-type="getUserInfo">获取用户信息</button>'
    const input2 = '<button open-type="getPhoneNumber">获取手机号</button>'
    const input3 = '<button open-type="openSetting">打开设置面板</button>'
    const input4 = '<button open-type="{{aaa}}">{{name}}</button>'

    const output1 = compileTemplate(input1, { srcMode: 'wx', mode: 'ali' })
    const output2 = compileTemplate(input2, { srcMode: 'wx', mode: 'ali' })
    compileTemplate(input3, { srcMode: 'wx', mode: 'ali' })
    const output4 = compileTemplate(input4, { srcMode: 'wx', mode: 'tt' })

    expect(output1).toBe('<button open-type="getAuthorize" scope="userInfo">获取用户信息</button>')
    expect(output2).toBe('<button open-type="getAuthorize" scope="phoneNumber">获取手机号</button>')
    expect(errorFn).toHaveBeenCalledWith('<button>\'s property \'open-type\' does not support \'[openSetting]\' value in ali environment!')
    expect(output4).toBe('<button open-type="{{aaa}}">{{name}}</button>')
  })

  it('should trans button\'s open-type for qq', function () {
    const input = '<button open-type="{{ cardLogin ? \'getUserInfo\' : \'\' }}" bindgetuserinfo="onGetUserInfo" bindtap="onNextStep">按钮</button>'
    const output = compileTemplate(input, { srcMode: 'wx', mode: 'qq' })

    expect(output).toBe('<button open-type="{{ cardLogin ? \'getUserInfo\' : \'\' }}" bindgetuserinfo="onGetUserInfo" bindtap="onNextStep">按钮</button>')

    expect(errorFn).not.toHaveBeenCalled()
  })

  it('should remain button\'s open-type for ali', function () {
    const input = '<button wx:if="{{__mpx_mode__ === \'ali\'}}" open-type="getAuthorize" scope="phoneNumber" onGetAuthorize="alipayPhonenumberLogin" onError="onGetPhoneNumberError">手机号授权登录</button>'
    const output = compileTemplate(input)

    expect(output).toBe('<button open-type="getAuthorize" scope="phoneNumber" onGetAuthorize="alipayPhonenumberLogin" onError="onGetPhoneNumberError">手机号授权登录</button>')

    expect(errorFn).not.toHaveBeenCalled()
  })
})
