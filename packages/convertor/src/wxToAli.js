/**
 * 将微信小程序的config转换成支付宝小程序支持的config
 * 包含生命周期 & properties
*/
export function wxToAli (mpx) {
  mpx.setConvertRule({
    lifecycleTemplate: 'wx',
    mode: 'blend',
    support: false,
    lifecycleProxyMap: {
      '__created__': ['created', 'attached'],
      '__mounted__': ['ready', 'onReady'],
      '__destroyed__': ['detached'],
      '__updated__': ['updated']
    },
    convert (options) {
      if (options.properties) {
        const newProps = {}
        Object.keys(options.properties).forEach(key => {
          const prop = options.properties[key]
          if (prop.value) {
            newProps[key] = prop.value
          }
        })
        options.properties = newProps
      }
    }
  })
}
