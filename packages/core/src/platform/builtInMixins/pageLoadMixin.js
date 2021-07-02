/**
 * 输出 H5 页面 onLoad
 * @param mixinType
 * @returns {{created(): void}}
 */
export default function onLoad (mixinType) {
  if (mixinType === 'page' && __mpx_mode__ === 'web') {
    return {
      created () {
        if (this.onLoad) {
          const query = (global.__mpxRouter && global.__mpxRouter.currentRoute && global.__mpxRouter.currentRoute.query) || {}
          this.onLoad(query)
        }
      }
    }
  }
}
