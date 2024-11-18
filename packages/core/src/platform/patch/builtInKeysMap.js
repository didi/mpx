import { INNER_LIFECYCLES } from '../../core/innerLifecycle'
import { makeMap } from '@mpxjs/utils'

let builtInKeys

if (__mpx_mode__ === 'web' || __mpx_mode__ === 'tenon') {
  builtInKeys = [
    'proto',
    'mixins',
    'initData',
    'mpxCustomKeysForBlend',
    'mpxConvertMode',
    'mpxFileResource',
    '__nativeRender__',
    '__type__',
    '__pageCtor__'
  ]
} else {
  builtInKeys = [
    'setup',
    'dataFn',
    'proto',
    'mixins',
    'initData',
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

export default makeMap(builtInKeys.concat(INNER_LIFECYCLES))
