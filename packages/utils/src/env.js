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

let lastFocusedNavigation

export function getFocusedNavigation () {
  if (global.__mpxPagesMap) {
    for (const key in global.__mpxPagesMap) {
      const navigation = global.__mpxPagesMap[key][1]
      if (navigation && navigation.isFocused()) {
        lastFocusedNavigation = navigation
        return navigation
      }
    }
    return lastFocusedNavigation
  }
}
