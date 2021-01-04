/**
 * 输出 H5 页面 onLoad
 * @param mixinType
 * @returns {{created(): void}}
 */
import { getUrlQueryParams } from '../../helper/utils'
export default function onLoad (mixinType) {
  if (mixinType === 'page' && __mpx_mode__ === 'web') {
    return {
      created () {
        if (this.onLoad) {
          const locationHref = window.location.href
          const options = getUrlQueryParams(locationHref)
          this.onLoad(options)
        }
      }
    }
  }
}
