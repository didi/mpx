import mpx from '@mpxjs/core'
import { getOpenid } from 'api'
import { WX_APP_ID } from './constants'

export function wxLogin () {
  return new Promise((resolve, reject) => {
    mpx.login({
      scopes: 'auth_base',
      success: res => {
        resolve(res)
      },
      fail: res => {
        reject(res)
      }
    })
  })
}

export function getOpenId () {
  return wxLogin().then(({ code }) => {
    return getOpenid({
      source: 'wxapp',
      // eslint-disable-next-line camelcase
      app_id: WX_APP_ID,
      code,
      // eslint-disable-next-line camelcase
      need_unionid: 0
    })
  }).then(data => {
    const { openid } = data || {}
    return openid
  })
}

export const showWechatModal = (content) => {
  return mpx.showModal({
    content,
    confirmText: '确定'
  })
}
