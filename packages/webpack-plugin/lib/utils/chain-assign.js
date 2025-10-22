/**
 * 链式合并方法的工具函数
 *
 * 这个函数通过智能合并来确保所有方法都能按顺序执行。
 * 支持函数直接合并到 enter 数组，以及对象形式的 enter、exit 等钩子合并。
 * {memberExpression: fn1}, {memberExpression: fn2} => {memberExpression: enter: [fn1, fn2]}
 * {memberExpression: {enter: fn1}}, {memberExpression: {exit:fn2}} => {memberExpression: {enter: fn1, exit: fn2}}
**/

module.exports = function chainAssign (target, source) {
  for (const [key, value] of Object.entries(source)) {
    if (target[key]) {
      // 如果已存在同名方法，需要合并
      const existingValue = target[key]
      const normalized = normalizeVisitor(existingValue)
      const newNormalized = normalizeVisitor(value)
      // 合并所有钩子
      target[key] = mergeVisitorHooks(normalized, newNormalized)
    } else {
      target[key] = value
    }
  }
  return target
}

function normalizeVisitor(method) {
  if (typeof method === 'function') {
    // 如果仅传入函数，默认作为 enter 钩子
    return { enter: [method] }
  } else if (method && typeof method === 'object') {
     return method
  }
  return {}
}

function mergeVisitorHooks(existing, newVisitor) {
  const result = existing
  for (const [hookName, hookFunctions] of Object.entries(newVisitor)) {
    if (result[hookName]) {
      // 如果已存在该钩子，需要根据类型进行合并
      const existingHook = result[hookName]
      const newHook = hookFunctions

      // 将两个值都标准化为数组
      const existingArray = Array.isArray(existingHook) ? existingHook : [existingHook]
      const newArray = Array.isArray(newHook) ? newHook : [newHook]
      // 合并两个数组
      result[hookName] = [...existingArray, ...newArray]
    } else {
      // 如果不存在，直接赋值
      result[hookName] = hookFunctions
    }
  }

  return result
}
