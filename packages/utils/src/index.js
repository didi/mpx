export {
  warn,
  error
} from './log'

export {
  getByPath,
  setByPath,
  doGetByPath
} from './processPath'

export {
  noop,
  isString,
  isBoolean,
  isNumber,
  isArray,
  type,
  isDef,
  isFunction,
  isObject,
  isNumberStr,
  isValidIdentifierStr,
  normalizeMap,
  aliasReplace,
  stringifyClass,
  hasProto,
  dash2hump,
  hump2dash
} from './common'

export {
  hasOwn,
  isPlainObject,
  diffAndCloneA,
  proxy,
  spreadProp,
  collectDataset
} from './processObj'

export {
  makeMap,
  findItem
} from './processArray'

export {
  aIsSubPathOfB,
  mergeData,
  merge
} from './mergeData'

export {
  genStyleText,
  normalizeDynamicStyle
} from './processStyle'
