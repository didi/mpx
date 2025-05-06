const proxyGlobal = Object.create(
  (typeof globalThis === 'object'
    ? globalThis
    : (() => {
          // eslint-disable-next-line no-new-func
      try { return this || new Function('return this')() } catch (e) { return window }
    })()
  )
)

export default proxyGlobal
