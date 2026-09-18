
import { createPage } from '@mpxjs/core'
import { fetchOrders } from './service'

createPage({
  data: {
    sections: [],
    scrollTop: 0,
    pageNo: 1,
    opened: false,
    isSkyline: false,
    statusBarHeight: 0,
    bodyHeight: 0,
    refreshing: false,
    loading: false,
    error: ''
  },
  onLoad () {
    this.isSkyline = this.renderer === 'skyline'
    this.updateSize()
    this.reload()
  },
  onResize () { this.updateSize() },
  methods: {
    updateSize () {
      const info = wx.getWindowInfo ? wx.getWindowInfo() : wx.getSystemInfoSync()
      this.statusBarHeight = info.statusBarHeight || 0
      this.bodyHeight = Math.max(0, info.windowHeight - this.statusBarHeight - 44)
    },
    onRefresh () { return this.reload() },
    reload (shouldFail = false) {
      // A refresh supersedes a pending pagination request.
      const request = this._request = (this._request || 0) + 1
      this.refreshing = true
      this.loading = true
      this.error = ''
      return fetchOrders(1, shouldFail).then(sections => {
        if (request !== this._request) return
        this.sections = sections
        this.pageNo = 1
      }).catch(error => {
        if (request === this._request) this.error = error.message
      }).finally(() => {
        if (request === this._request) {
          this.refreshing = false
          this.loading = false
        }
      })
    },
    loadMore () {
      if (this.loading || !this.sections.length) return Promise.resolve()
      const request = this._request = (this._request || 0) + 1
      const nextPage = this.pageNo + 1
      this.loading = true
      this.error = ''
      return fetchOrders(nextPage).then(sections => {
        if (request !== this._request) return
        this.sections = this.sections.concat(sections)
        this.pageNo = nextPage
      }).catch(error => {
        if (request === this._request) this.error = error.message
      }).finally(() => {
        if (request === this._request) this.loading = false
      })
    },
    onMainScroll (event) { this.scrollTop = event.detail.scrollTop },
    open () { this.opened = true },
    close () { this.opened = false },
    ignoreMove () {}
  }
})
