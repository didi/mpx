import React, { forwardRef } from 'react'
import Carouse from './carouse'
import { SwiperProps } from './type'
import useInnerTouchable from '../getInnerListeners'
import useNodesRef from '../../../useNodesRef'

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
 * ✔ previous-margin
 * ✔ next-margin
 * ✘ snap-to-edge
 */
const _SwiperWrapper = forwardRef((props: SwiperProps, ref) => {
  const { children } = props
  const swiperProp = {
    circular: props.circular,
    index: props.current,
    autoplay: props.autoplay,
    duration: props.duration || 500,
    interval: props.interval || 5000,
    showsPagination: props['indicator-dots'],
    dotColor: props['indicator-color'] || "rgba(0, 0, 0, .3)",
    activeDotColor: props['indicator-active-color'] || '#000000',
    horizontal: props.vertical !== undefined ? !props.vertical : true,
    style: props.style,
    previousMargin: props['previous-margin'] ? parseInt(props['previous-margin']) : 0,
    nextMargin: props['next-margin'] ? parseInt(props['next-margin']) : 0,
    bindchange: props.bindchange
  }
  const { nodeRef } = useNodesRef(props, ref, {
  })
  const innerTouchable = useInnerTouchable({
    ...props
  });
  return (
      <Carouse
        ref={nodeRef}
        {...swiperProp}
        {...innerTouchable}>
        {children}
      </Carouse>

  )
})
_SwiperWrapper.displayName = '_Swiper';

export default _SwiperWrapper