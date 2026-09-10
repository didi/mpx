
import { createPage } from '@mpxjs/core'
import { fetchOrders } from './service'

createPage({
  data: {
    orders: [],
    scrollTop: 0,
    pageNo: 1,
    refreshing: false,
    statusBarHeight: 0,
    navigationHeight: 44,
    scrollHeight: 0
  },
  onLoad () {
    this.updateLayout()
    return this.reload()
  },
  onResize () {
    this.updateLayout()
  },
  methods: {
    updateLayout () {
      const { windowHeight, statusBarHeight } = wx.getWindowInfo()
      const menu = wx.getMenuButtonBoundingClientRect()
      this.statusBarHeight = statusBarHeight
      this.navigationHeight = (menu.top - statusBarHeight) * 2 + menu.height
      this.scrollHeight = windowHeight - statusBarHeight - this.navigationHeight
    },
    onRefresh () {
      this.refreshing = true
      return this.reload()
    },
    onScroll (e) {
      this.scrollTop = e.detail.scrollTop
    },
    reload () {
      return fetchOrders(1).then(rows => {
        this.orders = rows
        this.pageNo = 1
      }).finally(() => {
        this.refreshing = false
      })
    },
    loadMore () {
      return fetchOrders(this.pageNo + 1).then(rows => {
        this.orders = this.orders.concat(rows)
        this.pageNo += 1
      })
    }
  }
})
