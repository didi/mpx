import { Easing } from 'react-native'
import { EaseType } from './type'
// 参考https://github.com/thisXY/react-native-easing/blob/master/src/index.js

export const EaseMap =  {
  default: Easing.linear,
  linear: Easing.linear,
  easeInCubic: Easing.bezier(0.55, 0.055, 0.675, 0.19),
  easeOutCubic: Easing.bezier(0.215, 0.61, 0.355, 1.0),
  easeInOutCubic: Easing.bezier(0.645, 0.045, 0.355, 1.0)
}