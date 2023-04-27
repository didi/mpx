export {
  warn,
  error
} from './log'

export {
  hasProto,
  noop,
  type,
  isString,
  isBoolean,
  isNumber,
  isArray,
  isFunction,
  isObject,
  isEmptyObject,
  isDef,
  isNumberStr,
  isValidIdentifierStr,
  aliasReplace,
  dash2hump,
  hump2dash,
  def,
  hasChanged
} from './base'

export {
  getByPath,
  setByPath,
  doGetByPath,
  getFirstKey,
  aIsSubPathOfB
} from './path'

export {
  hasOwn,
  isPlainObject,
  diffAndCloneA,
  proxy,
  spreadProp,
  enumerableKeys,
  processUndefined
} from './object'

export {
  arrayProtoAugment,
  makeMap,
  findItem,
  remove,
  isValidArrayIndex
} from './array'

export {
  mergeData,
  mergeObj,
  mergeObjectArray
} from './merge'

export {
  callWithErrorHandling
} from './errorHandling'

export {
  walkChildren,
  parseSelector
} from './element'

export {
  getEnvObj,
  isBrowser,
  isDev
} from './env'
