/**
 * 输出 H5 页面 onLoad
 * @param mixinType
 * @returns {{created(): void}}
 */
export default function onLoad (mixinType) {
  if (mixinType === 'page' && __mpx_mode__ === 'web') {
    const getUrlParams = () => {
      const urlParams = {}
      try {
        const locationHref = window.location.href
        if (locationHref.indexOf('?') !== -1) {
          const paramsStr = locationHref.split('?')[1]
          if (paramsStr) {
            const paramsArr = paramsStr.split('&')
            paramsArr.forEach((param) => {
              const key = param.split('=')[0]
              const value = param.split('=')[1]
              urlParams[key] = decodeURIComponent(value)
            })
          }
        }
      } catch (e) {
        console.error('page onLoad parse url query error:', e)
      }
      return urlParams
    }
    return {
      created () {
        if (this.onLoad) {
          const options = getUrlParams()
          this.onLoad(options)
        }
      }
    }
  }
}
