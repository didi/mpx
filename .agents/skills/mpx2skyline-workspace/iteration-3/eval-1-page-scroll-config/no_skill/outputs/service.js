export function fetchOrders(page) { return Promise.resolve(Array.from({ length: 20 }, (_, index) => ({ id: page * 100 + index, name: '订单 ' + page + '-' + index }))) }
