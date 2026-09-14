
import { createPage } from '@mpxjs/core'
import { fetchOrders } from './service'

createPage({
  data: {
    orders: [],
    scrollTop: 0,
    pageNo: 1,
    refreshing: false,
    loading: false,
    windowHeight: 0,
    statusBarHeight: 0,
    navigationHeight: 44,
    scrollHeight: 0
  },
  onLoad () {
    const { windowHeight, statusBarHeight } = wx.getWindowInfo()
    const menu = wx.getMenuButtonBoundingClientRect()
    this.windowHeight = windowHeight
    this.statusBarHeight = statusBarHeight
    this.navigationHeight = menu.height + (menu.top - statusBarHeight) * 2
    this.scrollHeight = windowHeight - statusBarHeight - this.navigationHeight - 32
    this.reload()
  },
  methods: {
    onScroll (e) {
      this.scrollTop = e.detail.scrollTop
    },
    onRefresh () {
      this.refreshing = true
      return this.reload()
    },
    reload () {
      if (this.loading) {
        this.refreshing = false
        return
      }
      this.loading = true
      return fetchOrders(1).then(rows => {
        this.orders = rows
        this.pageNo = 1
      }).catch(() => {
        wx.showToast({ title: '加载失败，请重试', icon: 'none' })
      }).finally(() => {
        this.loading = false
        this.refreshing = false
      })
    },
    loadMore () {
      if (this.loading) return
      this.loading = true
      return fetchOrders(this.pageNo + 1).then(rows => {
        this.orders = this.orders.concat(rows)
        this.pageNo += 1
      }).catch(() => {
        wx.showToast({ title: '加载失败，请重试', icon: 'none' })
      }).finally(() => {
        this.loading = false
      })
    }
  }
})
