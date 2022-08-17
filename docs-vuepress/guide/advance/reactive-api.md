# 响应性 API

在 Mpx 中，为了支持[组合式 API](composition-api.md) 的使用，我们参考 Vue3 提供了相关的响应性 API，但由于 proxy 目前仍然存在浏览器兼容性问题，我们在底层还是基于 `Object.defineProperty` 实现的数据响应，因此相较于 Vue3 提供的 API 存在一些删减，同时也存在与 Vue2 一样的响应性[使用限制](https://v2.cn.vuejs.org/v2/guide/reactivity.html#%E6%A3%80%E6%B5%8B%E5%8F%98%E5%8C%96%E7%9A%84%E6%B3%A8%E6%84%8F%E4%BA%8B%E9%A1%B9)。

## 创建响应式对象

在 Mpx 中，我们可以使用 `reactive` 方法将一个 JavaScript 对象转换为响应式的，
