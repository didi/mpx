import transferOptions from '../../core/transferOptions'
import getBuiltInMixins from '../builtInMixins/index'
import { getDefaultOptions as getWXDefaultOptions } from './wx/getDefaultOptions'
import { getDefaultOptions as getALIDefaultOptions } from './ali/getDefaultOptions'
import { is } from '../../helper/env'

export default function createFactory (type) {
  return (options, constructor) => {
    let getDefaultOptions
    if (is('wx') || is('swan')) {
      constructor = Component
      getDefaultOptions = getWXDefaultOptions
      // 微信小程序使用组件创建页面，走混合merge
      type === 'page' && (options.blend = true)
    } else if (is('ali')) {
      getDefaultOptions = getALIDefaultOptions
    } else {
      console.error('not support current env')
    }
    // 获取内建的mixins
    const builtInMixins = getBuiltInMixins(options, type)
    const defaultOptions = getDefaultOptions(type, transferOptions(options, type, builtInMixins))
    constructor(defaultOptions)
  }
}
