export function getEnvObj () {
  switch (__mpx_mode__) {
    case 'wx':
      return wx
    case 'ali':
      return my
    case 'swan':
      return swan
    case 'qq':
      return qq
    case 'tt':
      return tt
    case 'jd':
      return jd
    case 'qa':
      return qa
    case 'dd':
      return dd
  }
}

export const isBrowser = typeof window !== 'undefined'

export const isDev = process.env.NODE_ENV !== 'production'

export const isServerRendering = () => {
  let _isServer
  if (!isBrowser && typeof global !== 'undefined') {
    _isServer =
      global.process && global.process.env.VUE_ENV === 'server'
  } else {
    _isServer = false
  }
  return _isServer
}
