/**
 * 输出 H5 页面 onresize
 * @param mixinType
 * @returns {{deactivated(): void, activated(): void}}
 */
export default function onResize (mixinType) {
  if (mixinType === 'page' && __mpx_mode__ === 'web') {
    var resizeMethod = null
    var resizeCallback = function () {
      var w = window.innerWidth || document.documentElement.clientWidth || document.body.clientWidth
      var h = window.innerHeight || document.documentElement.clientHeight || document.body.clientHeight
      resizeMethod && resizeMethod({ size: { windowWidth: w, windowHeight: h } })
    }
    return {
      activated () {
        if (this.onResize) {
          resizeMethod = this.onResize
          window.addEventListener('resize', resizeCallback, false)
        }
      },
      deactivated () {
        if (this.onResize) {
          window.removeEventListener('resize', resizeCallback, false)
        }
      }
    }
  }
}
