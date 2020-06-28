const { compileAndParse, warnFn, errorFn } = require('../util')

describe('template should transform correct', function () {
  afterEach(() => {
    warnFn.mockClear()
    errorFn.mockClear()
  })

  it('work correct in wx mode', function () {
    const input1 = `<view @wx>123</view>`
    const output1 = compileAndParse(input1)
    expect(output1).toBe('')
    const input2 = `<view t1@wx="ttt">123</view>`
    const output2 = compileAndParse(input2, { mode: 'wx' })
    expect(output2).toBe('<view t1="ttt">123</view>')
  })

  it('only keep it when mode be ali', function () {
    const input = `<ali-view @ali test@ali="ttt">123</ali-view>`
    const output1 = compileAndParse(input)
    expect(output1).toBe('<ali-view test="ttt">123</ali-view>')
    const output2 = compileAndParse(input, { mode: 'wx' })
    expect(output2).toBe('')
  })

  it('will remove with child node if mode not match', function () {
    const input = `<ali-view @ali|swan test@ali="ttt"><ttt bindtap="handleTap">123</ttt></ali-view>`
    const output = compileAndParse(input, { mode: 'wx' })
    expect(output).toBe('')
  })

  it('will no trans child node if parent is matched mode', function () {
    const input = `<ali-view @ali test@ali="ttt"><ttt bindtap="handleTap">123</ttt></ali-view>`
    const output = compileAndParse(input)
    expect(output).toBe('<ali-view test="ttt"><ttt bindtap="handleTap">123</ttt></ali-view>')
  })

  it('work correct with multi mode', function () {
    const input = `<ali-view @ali|swan test@ali="ttt"><ttt bindtap="handleTap">123</ttt></ali-view>`

    const aliOutput = compileAndParse(input, { mode: 'ali' })
    expect(aliOutput).toBe('<ali-view test="ttt"><ttt bindtap="handleTap">123</ttt></ali-view>')

    const swanOutput = compileAndParse(input, { mode: 'swan' })
    expect(swanOutput).toBe('<ali-view><ttt bindtap="handleTap">123</ttt></ali-view>')
  })

  it('without error report when use condition syntax', function () {
    const input = `<button open-type@ali="{{testVal}}" scope@ali="phoneNumber" onGetAuthorize@ali="alipayPhonenumberLogin" onError@ali="onGetPhoneNumberError">手机号授权登录</button>`
    const output = compileAndParse(input)
    expect(warnFn).not.toHaveBeenCalled()
    expect(output).toBe('<button open-type="{{testVal}}" scope="phoneNumber" onGetAuthorize="alipayPhonenumberLogin" onError="onGetPhoneNumberError">手机号授权登录</button>')
  })

  it('should no trans for specific attr if matched mode', function () {
    // 默认会按规则进行自动转换
    const inputBefore = '<button open-type="getUserInfo">获取用户信息</button>'
    const outputBefore = compileAndParse(inputBefore)
    expect(outputBefore).toBe('<button open-type="getAuthorize" scope="userInfo">获取用户信息</button>')

    // 通过@指定mode后，不再走转换规则
    const input = '<button open-type@ali="getUserInfo">获取用户信息</button>'
    const output = compileAndParse(input)
    expect(output).toBe('<button open-type="getUserInfo">获取用户信息</button>')
  })

  it('should work correct with web mode', function () {
    const input = '<button @click@web="handleClick">获取用户信息</button>'
    const output = compileAndParse(input, { mode: 'web' })
    expect(output).toBe('<button @click="handleClick">获取用户信息</button>')
  })

  it('should work normal if no attr in tag', function () {
    const input = '<button>获取用户信息</button>'
    const output = compileAndParse(input)
    expect(output).toBe('<button>获取用户信息</button>')
  })

  it('if attr name matched mode name should work correct', function () {
    const input = '<button ali@swan="handleClick">获取用户信息</button>'
    const output = compileAndParse(input)
    expect(output).toBe('<button>获取用户信息</button>')
  })
})
