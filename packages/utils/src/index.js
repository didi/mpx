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
  isEmptyObject,
  isNumberStr,
  isValidIdentifierStr,
  normalizeMap,
  aliasReplace,
  stringifyClass,
  hasProto,
  dash2hump,
  hump2dash,
  processUndefined,
  concat,
  defProp
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
  findItem,
  remove,
  arrayProtoAugment,
  isValidArrayIndex
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

export {
  preProcessRenderData
} from './processRender'

export {
  callWithErrorHandling
} from './errorHandling'

export {
  walkChildren,
  parseSelector
} from './ProcessElement'
