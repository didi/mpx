import { Ajax } from '@didi/driver-biz-mp-sdk'

let ajax = Ajax
if (__mpx_mode__ === 'web') {
  ajax.initAjax()
  // 抹平 login 模块在 web 打包的 API 调用
  ajax.setCommonParams = () => {}
} else {
  ajax = Ajax.initAjax()
}

// eslint-disable-next-line no-unused-vars
// const offline = 'http://10.96.76.251:8094/popeapi/rosenbridge' // 线下
// eslint-disable-next-line no-unused-vars
const simPre = 'http://10.96.91.170:8094/popeapi/rosenbridge' // sim 预发
// eslint-disable-next-line no-unused-vars
// const simPreWithOpenPath = 'http://10.192.113.49:8000/popeapi/rosenbridge/open' // sim 预发-免代理
// eslint-disable-next-line no-unused-vars
const online = 'https://api.didi.cn/popeapi/rosenbridge' // 线上
// todo
const BASE_URL_MAP = {
  development: simPre,
  production: online
}

const env = process.env.NODE_ENV || 'production'

const BASE_URL = BASE_URL_MAP[env]

ajax.axios.interceptors.request.use((config) => {
  return config
})

ajax.axios.interceptors.response.use((res) => {
  return res.data
})

export { ajax }

export const getFestivalCenter = ajax.get(`${BASE_URL}/festival/center`)
export const joinOrCreatePaopao = ajax.get(`${BASE_URL}/festival/toggle_init`) // 受邀参加 & 创建参加 跑跑预约礼
export const noticeFriendsWork = ajax.get(`${BASE_URL}/festival/toggle_manual_notice`) // 通知好友出车
export const getFriendsList = ajax.get(`${BASE_URL}/festival/toggle_relation_get`) // 获取邀请好友列表
export const getAreaInfo = ajax.get(`https://dorado.xiaojukeji.com/usce-api/v2/h5/city/getAreaInfoByLatLng`) // 小程序获取地址
export const getOpenid = ajax.get('https://common.diditaxi.com.cn/webapp/platform/oauth2/code2unionid') // 获取 openid
export const getPoster = ajax.get(`${BASE_URL}/festival/create_painter`) // 获取海报
export const getCommunityQrCode = ajax.get(`${BASE_URL}/festival/community_qrcode`) // 微信群二维码
