import { ajax } from '../../api/index'
const { RootStore } = getApp()

async function isLogin () {
  const userInfo = RootStore.state.userInfo.ticket ? RootStore.state.userInfo : await RootStore.dispatch('isLogin')
  const { ticket, phone } = userInfo || {}
  if (ticket) {
    return {
      ticket,
      phone
    }
  }
}

async function login () {
  // 已经登陆过
  const ret = await isLogin()
  if (ret) {
    ajax.setCommonParams({ ticket: ret.ticket })
    return
  }
  return RootStore.dispatch('login').then(async ({ ticket }) => {
    ajax.setCommonParams({ ticket })
  })
}

async function logout () {
  return RootStore.dispatch('logout')
}

export {
  isLogin,
  login,
  logout
}
