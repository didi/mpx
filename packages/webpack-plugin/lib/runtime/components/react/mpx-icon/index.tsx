/**
 * ✔ type
 * ✔ size
 * ✔ color
 */
import { JSX, forwardRef, useRef, createElement } from 'react'
import { Text, TextStyle, Image } from 'react-native'
import useInnerProps from '../getInnerListeners'
import useNodesRef, { HandlerRef } from '../useNodesRef'
import { useLayout, useTransformStyle, extendObject } from '../utils'
import Success from './icons/success.png'
import SuccessNoCircle from './icons/success_no_circle.png'
import Info from './icons/info.png'
import Warn from './icons/warn.png'
import Waiting from './icons/waiting.png'
import Cancel from './icons/cancel.png'
import Download from './icons/download.png'
import Search from './icons/search.png'
import Clear from './icons/clear.png'

export type IconType =
  | 'success'
  | 'success_no_circle'
  | 'info'
  | 'warn'
  | 'waiting'
  | 'cancel'
  | 'download'
  | 'search'
  | 'clear'

export interface IconProps {
  type: IconType
  size?: number
  color?: string
  style?: TextStyle & Record<string, any>
  'enable-offset'?: boolean
  'enable-var'?: boolean
  'external-var-context'?: Record<string, any>
  'parent-font-size'?: number
  'parent-width'?: number
  'parent-height'?: number
}

const IconTypeMap = new Map<IconType, string>([
  ['success', Success],
  ['success_no_circle', SuccessNoCircle],
  ['info', Info],
  ['warn', Warn],
  ['waiting', Waiting],
  ['cancel', Cancel],
  ['download', Download],
  ['search', Search],
  ['clear', Clear]
])

const Icon = forwardRef<HandlerRef<Text, IconProps>, IconProps>(
  (props, ref): JSX.Element => {
    const {
      type,
      size = 23,
      color,
      style = {},
      'enable-var': enableVar,
      'external-var-context': externalVarContext,
      'parent-font-size': parentFontSize,
      'parent-width': parentWidth,
      'parent-height': parentHeight
    } = props

    const source = IconTypeMap.get(type)

    const defaultStyle = { width: ~~size, height: ~~size }

    const styleObj = extendObject({}, defaultStyle, style)

    const {
      hasSelfPercent,
      normalStyle,
      setWidth,
      setHeight
    } = useTransformStyle(styleObj, { enableVar, externalVarContext, parentFontSize, parentWidth, parentHeight })

    const nodeRef = useRef(null)
    useNodesRef(props, ref, nodeRef, { style: normalStyle })

    const { layoutRef, layoutStyle, layoutProps } = useLayout({ props, hasSelfPercent, setWidth, setHeight, nodeRef })

    const innerProps = useInnerProps(
      extendObject(
        {},
        props,
        layoutProps,
        {
          ref: nodeRef,
          source,
          style: extendObject({}, normalStyle, layoutStyle, { tintColor: color })
        }
      ),
      [],
      {
        layoutRef
      }
    )

    return createElement(Image, innerProps)
  }
)

Icon.displayName = 'MpxIcon'

export default Icon
