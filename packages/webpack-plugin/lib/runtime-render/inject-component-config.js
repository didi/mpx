module.exports = {
  includes: new Set(),
  exclude: new Set(),
  // 收集自定义组件元素节点
  thirdPartyComponents: new Map(),
  // 收集运行时组件元素节点
  runtimeComponents: new Map(),
  includeAll: false,
  // 收集基础元素(小程序内置组件)节点
  internalComponents: {}
}
