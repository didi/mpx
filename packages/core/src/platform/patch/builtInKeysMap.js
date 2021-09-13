import { INNER_LIFECYCLES } from '../../core/innerLifecycle'
import { makeMap } from '../../helper/utils'

let bulitInKeys

if (__mpx_mode__ === 'web' || __mpx_mode__ === 'tenon') {
  bulitInKeys = [
    'proto',
    'mixins',
    'mpxCustomKeysForBlend',
    'mpxConvertMode',
    'mpxFileResource',
    '__nativeRender__',
    '__type__',
    '__pageCtor__'
  ]
} else {
  bulitInKeys = [
    'dataFn',
    'proto',
    'mixins',
    'watch',
    'computed',
    'mpxCustomKeysForBlend',
    'mpxConvertMode',
    'mpxFileResource',
    '__nativeRender__',
    '__type__',
    '__pageCtor__'
  ]
}

export default makeMap(bulitInKeys.concat(INNER_LIFECYCLES))
