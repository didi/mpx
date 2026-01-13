import * as platformExports from '../../index.js'

let SUPPORTED_APIS = null
let SUPPORTED_OBJECTS = null
let OBJECT_METHODS = null

/**
 * 获取类的所有方法名（包括 getter/setter）
 * @param {Function} ClassConstructor - 类构造函数
 * @returns {Array<string>} 方法名数组
 */
function getClassMethods (ClassConstructor) {
  const methods = new Set()

  // 从原型上获取所有方法和属性
  const proto = ClassConstructor.prototype
  if (proto) {
    Object.getOwnPropertyNames(proto).forEach(key => {
      if (key === 'constructor') return

      const descriptor = Object.getOwnPropertyDescriptor(proto, key)
      // 收集方法和 getter/setter
      if (descriptor) {
        if (typeof descriptor.value === 'function') {
          methods.add(key)
        } else if (descriptor.get || descriptor.set) {
          // getter/setter 也算作可用的属性
          methods.add(key)
        }
      }
    })
  }

  return Array.from(methods)
}

/**
 * 检查导出是否为类构造函数
 * @param {*} exportValue - 导出值
 * @returns {boolean} 是否为类
 */
function isClassConstructor (exportValue) {
  if (typeof exportValue !== 'function') {
    return false
  }

  // 检查是否有 prototype
  if (!exportValue.prototype) {
    return false
  }

  // 方法1: 检查原型上是否有多个属性（排除简单的构造函数）
  // constructor 始终存在，如果还有其他属性/方法，很可能是类
  const protoProps = Object.getOwnPropertyNames(exportValue.prototype)
  if (protoProps.length > 1) {
    return true
  }

  // 方法2: 检查 prototype 描述符（ES6 类特征）
  // ES6 类的 prototype 属性是不可写的
  const descriptor = Object.getOwnPropertyDescriptor(exportValue, 'prototype')
  if (descriptor && !descriptor.writable) {
    return true
  }

  return false
}

/**
 * 从 platform/index.js 的导出自动获取所有 API
 * class 不会从 platform 导出（它们通过工厂函数创建），需要单独扫描
 *
 * @returns {Set} API 集合
 */
function scanPlatformApis () {
  const apis = new Set()

  // 遍历 platform 的所有导出
  Object.keys(platformExports).forEach(exportName => {
    // 跳过内部属性和 canIUse 本身（避免循环）
    if (exportName === '__esModule' || exportName === 'default' || exportName === 'canIUse') {
      return
    }

    const exportValue = platformExports[exportName]

    // 收集所有函数和非空导出作为 API
    if (typeof exportValue === 'function' || exportValue !== undefined) {
      apis.add(exportName)
    }
  })

  return apis
}

/**
 * 扫描并加载类定义
 *
 * @returns {Object} { objects: Set, methods: Object }
 */
function scanClassDefinitions () {
  const objects = new Set()
  const methods = {}

  /**
   * 尝试加载一个模块并检查是否为类
   * @param {string} modulePath - 模块路径
   */
  const tryLoadModule = (modulePath) => {
    try {
      const module = require(modulePath)
      const exportValue = module.default || module
      // 检查是否为类
      if (isClassConstructor(exportValue)) {
        // 优先使用类的 name 属性
        const className = exportValue.name
        if (className) {
          objects.add(className)
          methods[className] = getClassMethods(exportValue)
        }
      }
    } catch (e) {
      // 模块不存在或导入失败，静默跳过
    }
  }

  // 类文件路径配置
  // 添加新类时，在此处添加路径即可
  const classPaths = [
    // SelectorQuery 相关类
    '../create-selector-query/rnSelectQuery',
    '../create-selector-query/rnNodesRef',

    // IntersectionObserver 相关类
    '../create-intersection-observer/rnIntersectionObserver',

    // Animation 相关类
    '../animation/animation.ios',

    // Task 相关类
    '../socket/SocketTask',
    '../request/RequestTask',
    '../file/UploadTask',
    '../file/DownloadTask',

    // 其他 RN 工具类（按需添加）
    '../window/rnWindow',
    '../system/rnSystem',
    '../storage/rnStorage',
    '../device/network/rnNetwork',
    '../clipboard-data/rnClipboard',
    '../make-phone-call/rnMakePhone',
    '../screen-brightness/rnScreenBrightness'
  ]

  // 尝试加载所有类文件
  classPaths.forEach(tryLoadModule)

  return { objects, methods }
}

/**
 * 初始化支持的 API 列表
 *
 * 架构设计说明：
 * 1. API：从 platform/index.js 自动获取，完全零硬编码
 * 2. 类：通过路径配置加载（必要的配置，因为类不从 platform 导出）
 */
function initSupportedApis () {
  if (SUPPORTED_APIS !== null) {
    return
  }

  // 从 platform 导出自动获取所有 API
  SUPPORTED_APIS = scanPlatformApis()

  // 通过路径配置扫描类定义
  const { objects, methods } = scanClassDefinitions()
  SUPPORTED_OBJECTS = objects
  OBJECT_METHODS = methods
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
