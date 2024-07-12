import { createContext } from 'react'
import { Dimensions } from 'react-native'

export const OrientationContext = createContext(null)

export function getOrientation (window = Dimensions.get('window')) {
  return window.width > window.height ? 'landscape' : 'portrait'
}
