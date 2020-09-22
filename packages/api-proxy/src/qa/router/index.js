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
function switchTab ({ url, params }) {
  console.warn('快应用需要自己处理custom-tab-bar文件中切换选项，进行渲染')
}
export {
  navigateTo,
  navigateBack,
  redirectTo,
  reLaunch,
  switchTab
}
