

























import { createPage } from '@mpxjs/core'
import { fetchOrders } from './service'

const isSkyline = __mpx_mode__ === 'wx' && __mpx_env__ === 'skyline'

createPage({
  data: {
    orders: [],
    scrollTop: 0,
    pageNo: 1,
    refreshing: false,
    loading: false,
    errorMessage: '',
    statusBarHeight: 0,
    navigationHeight: 44
  },
  onLoad () {
    if (isSkyline) {
      const { statusBarHeight } = wx.getWindowInfo()
      const menu = wx.getMenuButtonBoundingClientRect()
      this.statusBarHeight = statusBarHeight
      this.navigationHeight = (menu.top - statusBarHeight) * 2 + menu.height
    }
    return this.reload()
  },
  onPullDownRefresh () {
    return this.reload()
  },
  onReachBottom () {
    return this.loadMore()
  },
  onPageScroll (e) {
    this.scrollTop = e.scrollTop
  },
  methods: {
    onRefresh () {
      this.refreshing = true
      return this.reload()
    },
    onScroll (e) {
      this.scrollTop = e.detail.scrollTop
    },
    reload () {
      if (this.loading) {
        this.refreshing = false
        if (!isSkyline) wx.stopPullDownRefresh()
        return Promise.resolve()
      }
      this.loading = true
      this.errorMessage = ''
      return fetchOrders(1).then(rows => {
        this.orders = rows
        this.pageNo = 1
      }).catch(() => {
        this.errorMessage = '订单加载失败，请下拉重试'
      }).finally(() => {
        this.loading = false
        this.refreshing = false
        if (!isSkyline) wx.stopPullDownRefresh()
      })
    },
    loadMore () {
      if (this.loading) return Promise.resolve()
      this.loading = true
      this.errorMessage = ''
      return fetchOrders(this.pageNo + 1).then(rows => {
        this.orders = this.orders.concat(rows)
        this.pageNo += 1
      }).catch(() => {
        this.errorMessage = '加载更多失败，请重试'
      }).finally(() => {
        this.loading = false
      })
    }
  }
})
