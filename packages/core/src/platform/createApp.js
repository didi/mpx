import mergeOptions from '../core/mergeOptions'
import { mergeInjectedMixins } from '../core/injectMixins'
import { dissolveAttrs, extend } from '../helper/utils'

export default function createApp (option) {
  option = mergeInjectedMixins(option, 'app')
  // 保证最先执行
  option = mergeOptions(option, 'app')
  option.mixins = [{
    onLaunch () {
      extend(this, option.proto)
    }
  }]
  App(dissolveAttrs(mergeOptions(option, 'app'), 'methods')) /* eslint-disable-line */ 
}
