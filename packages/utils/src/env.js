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
    default:
      return {}
  }
}

export const isBrowser = typeof window !== 'undefined'

export const isDev = process.env.NODE_ENV !== 'production'

export const isReact = __mpx_mode__ === 'ios' || __mpx_mode__ === 'android' || __mpx_mode__ === 'harmony'

export const isWeb = __mpx_mode__ === 'web'

export function getFocusedNavigation () {
  let lastNav
  if (global.__mpxPagesMap) {
    for (const key in global.__mpxPagesMap) {
      const navigation = global.__mpxPagesMap[key][1]
      if (navigation) {
        lastNav = navigation
      }
      if (navigation && navigation.isFocused()) {
        return navigation
      }
    }
  }
  return lastNav
}
