/**
*@file 路由相关API
*@export
**/

// 此处引入先用webpack externals处理
import router from 'qAppRouter'
function navigateTo ({ url, params }) {
  router.push({
    uri: url,
    params: params || null
  })
}
function navigateBack ({ url, params }) {
  router.back({
    uri: url,
    params: params || null
  })
}
function redirectTo ({ url, params }) {
  router.replace({
    uri: url,
    params: params || null
  })
}
function reLaunch ({ url, params }) {
  router.push({
    uri: url,
    params: Object.assign({
      ___PARAM_LAUNCH_FLAG___: 'clearTask'
    }, params || {})
  })
}

function switchTab () {
  console.error(`mpx.switchTab在快应用中请调用this.triggerEvent('switchtab', {path: '**'})`)
}
export {
  navigateTo,
  navigateBack,
  redirectTo,
  reLaunch,
  switchTab
}
