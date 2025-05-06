const globalObj = typeof globalThis === 'object'
  ? globalThis
  : (() => {
    // eslint-disable-next-line no-new-func
    try { return this || new Function('return this')() } catch (e) { return window }
  })()

const proxyGlobal = new Proxy(Object.create(globalObj), {
  set (target, prop, value) {
    // 同步修改到真实全局对象
    Reflect.set(globalObj, prop, value)
    Reflect.set(target, prop, value)
    return true
  }
})

module.exports = proxyGlobal
