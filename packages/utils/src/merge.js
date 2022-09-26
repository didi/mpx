import { isObject } from './base'
import { hasOwn } from './object'
import { setByPath, aIsSubPathOfB } from './path'

function doMergeData (target, source) {
  Object.keys(source).forEach((srcKey) => {
    if (hasOwn(target, srcKey)) {
      target[srcKey] = source[srcKey]
    } else {
      let processed = false
      const tarKeys = Object.keys(target)
      for (let i = 0; i < tarKeys.length; i++) {
        const tarKey = tarKeys[i]
        if (aIsSubPathOfB(tarKey, srcKey)) {
          delete target[tarKey]
          target[srcKey] = source[srcKey]
          processed = true
          continue
        }
        const subPath = aIsSubPathOfB(srcKey, tarKey)
        if (subPath) {
          setByPath(target[tarKey], subPath, source[srcKey])
          processed = true
          break
        }
      }
      if (!processed) {
        target[srcKey] = source[srcKey]
      }
    }
  })
  return target
}

function mergeData (target, ...sources) {
  if (target) {
    sources.forEach((source) => {
      if (source) doMergeData(target, source)
    })
  }
  return target
}

// 用于合并i18n语言集
function mergeObj (target, ...sources) {
  if (isObject(target)) {
    for (const source of sources) {
      if (isObject(source)) {
        Object.keys(source).forEach((key) => {
          if (isObject(source[key]) && isObject(target[key])) {
            mergeObj(target[key], source[key])
          } else {
            target[key] = source[key]
          }
        })
      }
    }
  }
  return target
}

function mergeObjectArray (arr) {
  const res = {}
  for (let i = 0; i < arr.length; i++) {
    if (arr[i]) {
      Object.assign(res, arr[i])
    }
  }
  return res
}

export {
  mergeData,
  mergeObj,
  mergeObjectArray
}
