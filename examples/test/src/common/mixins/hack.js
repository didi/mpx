// 处理 wkwebview 不刷新页面的问题
export default {
  created () {
    this.wkWebviewHandler = (e) => {
      if (e.persisted) {
        window.location.reload()
      }
    }
    // 处理 wkwebview 缓存整个html的bug
    window.addEventListener('pageshow', this.wkWebviewHandler)
  },
  beforeDestroy () {
    window.removeEventListener('pageshow', this.wkWebviewHandler)
  }
}
