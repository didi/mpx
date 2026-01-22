import { SUPPORTED_APIS as API_LIST, SUPPORTED_OBJECTS as OBJECT_CONFIG } from './rnCanIUseConfig'

let SUPPORTED_APIS = null
let SUPPORTED_OBJECTS = null
let OBJECT_METHODS = null

/**
 * 初始化支持的 API 列表
 *
 * 使用静态配置而不是动态导入，避免加载原生模块
 * 这样 canIUse 只做判断，不触发任何模块的实际加载
 */
function initSupportedApis () {
  if (SUPPORTED_APIS !== null) {
    return
  }

  // 从静态配置中获取 API 列表
  SUPPORTED_APIS = new Set(API_LIST)

  // 从静态配置中获取对象和方法
  SUPPORTED_OBJECTS = new Set(Object.keys(OBJECT_CONFIG))
  OBJECT_METHODS = OBJECT_CONFIG
}

/**
 * 判断小程序的API、回调、参数、组件等是否在当前版本可用
 * @param {string} schema - 使用 ${API}.${method}.${param}.${option} 或者 ${component}.${attribute}.${option} 方式来调用
 * @returns {boolean} 是否支持
 */
function canIUse (schema) {
  // 延迟初始化，确保在首次调用时才加载 API 列表
  if (SUPPORTED_APIS === null) {
    initSupportedApis()
  }

  if (typeof schema !== 'string') {
    return false
  }

  // 检查是否包含 ${} 语法，这种语法是无效的，应该返回 false
  if (schema.includes('${') || schema.includes('}')) {
    return false
  }

  const parts = schema.split('.')
  const [first, second] = parts

  // 情况1: 只有一个部分,检查 API 或对象
  if (parts.length === 1) {
    return SUPPORTED_APIS.has(first) || SUPPORTED_OBJECTS.has(first)
  }

  // 情况2: 两个部分 - API.method 或 Object.property
  if (parts.length === 2) {
    // 检查是否是支持的 API
    if (SUPPORTED_APIS.has(first)) {
      return true // 在 RN 环境下,如果 API 支持,默认其方法也支持
    }
    // 检查对象的方法/属性
    if (SUPPORTED_OBJECTS.has(first)) {
      return checkObjectMethod(first, second)
    }
    return false
  }

  // 情况3: 三个或更多部分 - API.method.param 等
  if (parts.length >= 3) {
    // 检查基础 API 是否支持
    if (SUPPORTED_APIS.has(first)) {
      return true // 简化处理,如果 API 支持则认为其参数也支持
    }
    return false
  }

  return false
}

/**
 * 检查对象的方法是否支持
 */
function checkObjectMethod (objectName, methodName) {
  const methods = OBJECT_METHODS[objectName]
  if (!methods) {
    return false
  }

  return methods.includes(methodName)
}

export {
  canIUse
}
