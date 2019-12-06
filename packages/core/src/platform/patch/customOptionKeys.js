import { INNER_LIFECYCLES } from '../../core/innerLifecycle'

let customKeys

if (__mpx_mode__ === 'web') {
  customKeys = [
    'proto',
    'mixins',
    'mpxCustomKeysForBlend'
  ]
} else {
  customKeys = [
    'proto',
    'mixins',
    'watch',
    'computed',
    'mpxCustomKeysForBlend'
  ].concat(INNER_LIFECYCLES)
}

export default customKeys
