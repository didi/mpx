import { ScrollView } from 'react-native'
import { JSX, MutableRefObject, forwardRef, useRef } from 'react'
import { default as Carouse } from './carouse'
import { SwiperProps } from './type'
import useInnerProps from '../getInnerListeners'
import useNodesRef, { HandlerRef } from '../useNodesRef' // 引入辅助函数
/**
 * ✔ indicator-dots
 * ✔ indicator-color
 * ✔ indicator-active-color
 * ✔ autoplay
 * ✔ current
 * ✔ interval
 * ✔ duration
 * ✔ circular
 * ✔ vertical
 * ✘ display-multiple-items
 * ✘ previous-margin
 * ✘ next-margin
 * ✔ easing-function  ="easeOutCubic"
 * ✘ snap-to-edge
 */
const _SwiperWrapper = forwardRef<HandlerRef<ScrollView, SwiperProps>, SwiperProps>((props: SwiperProps, ref): JSX.Element => {
  const { children } = props
  let innerLayout = useRef({})
  const swiperProp = {
    circular: props.circular || false,
    current: props.current || 0,
    autoplay: props.autoplay || false,
    duration: props.duration || 500,
    interval: props.interval || 5000,
    showsPagination: props['indicator-dots'],
    dotColor: props['indicator-color'] || "rgba(0, 0, 0, .3)",
    activeDotColor: props['indicator-active-color'] || '#000000',
    horizontal: props.vertical !== undefined ? !props.vertical : true,
    styleObj: props.style || {},
    previousMargin: props['previous-margin'] ? parseInt(props['previous-margin']) : 0,
    nextMargin: props['next-margin'] ? parseInt(props['next-margin']) : 0,
    enableOffset: props['enable-offset'] || true,
    bindchange: props.bindchange,
    easingFunction: props['easing-function'] || 'default'
  }
  const { nodeRef } = useNodesRef<ScrollView, SwiperProps>(props, ref, {
  })
  const innerProps = useInnerProps(props, {
    ref: nodeRef
  }, [
    'indicator-dots',
    'indicator-color',
    'indicator-active-color',
    'previous-margin',
    'next-margin'
  ], { layoutRef: innerLayout })
  const getInnerLayout = (layout: MutableRefObject<{}>) => {
    innerLayout.current = layout.current
  }
  return <Carouse
    getInnerLayout={getInnerLayout}
    innerProps={innerProps}
    {...swiperProp}>
    {children}
  </Carouse>

})
_SwiperWrapper.displayName = '_mpxSwiper';

export default _SwiperWrapper
