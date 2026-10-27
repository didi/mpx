export function fetchOrders (page, shouldFail = false) {
  if (shouldFail) return Promise.reject(new Error('订单加载失败'))
  return Promise.resolve(Array.from({ length: 4 }, (_, groupIndex) => ({
    id: `group-${page}-${groupIndex}`,
    title: `订单分组 ${page}-${groupIndex}`,
    items: Array.from({ length: 8 }, (_, index) => ({
      id: `order-${page}-${groupIndex}-${index}`,
      name: `订单 ${page}-${groupIndex}-${index}`
    }))
  })))
}
