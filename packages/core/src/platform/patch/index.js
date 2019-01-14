import transferOptions from '../../core/transferOptions'
import getBuiltInMixins from '../builtInMixins/index'
import { getDefaultOptions as getWXDefaultOptions } from './wx/getDefaultOptions'
import { getDefaultOptions as getANTDefaultOptions } from './ant/getDefaultOptions'
export default function createFactory (type) {
  return (options, constructor) => {
    let getDefaultOptions
    if (typeof wx !== 'undefined') {
      constructor = Component
      getDefaultOptions = getWXDefaultOptions
      // 微信小程序使用组件创建页面，走混合merge
      type === 'page' && (options.blend = true)
    } else {
      getDefaultOptions = getANTDefaultOptions
    }
    // 获取内建的mixins
    const builtInMixins = getBuiltInMixins(options, type)
    const defaultOptions = getDefaultOptions(type, transferOptions(options, type, builtInMixins))
    constructor(defaultOptions)
  }
}
