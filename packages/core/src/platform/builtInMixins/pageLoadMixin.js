/**
 * 输出 H5 页面 onLoad
 * @param mixinType
 * @returns {{created(): void}}
 */
import { CREATED } from '../../core/innerLifecycle'
export default function onLoad (mixinType) {
  if (mixinType === 'page' && __mpx_mode__ === 'web') {
    return {
      [CREATED] () {
        if (this.onLoad) {
          const router = global.__mpxRouter || {}
          const current = (router.history && router.history.current) || {}
          this.onLoad(current.query)
        }
      }
    }
  }
}
