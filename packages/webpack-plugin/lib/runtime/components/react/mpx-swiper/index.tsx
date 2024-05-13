import React, { useRef, forwardRef, useImperativeHandle } from 'react'
import Carouse from './carouse'
import { SwiperProps } from './type'
import useInnerTouchable from '../getInnerListeners'

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
  const SwiperRef = useRef<Carouse>(null);
  const swiperProp = {
    ref: SwiperRef,
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
    previousMargin: props['previous-margin'],
    nextMargin: props['next-margin'],
    bindchange: props.bindchange
  }
  useImperativeHandle(ref, () => {
    return {
      type: 'swiper',
      context: {
        ...props
      },
      nodeRef: SwiperRef.current
    }
  })
  const innerTouchable = useInnerTouchable({
    ...props
  });
  return (
      <Carouse
        {...swiperProp}
        {...innerTouchable}>
        {children}
      </Carouse>

  )
})
_SwiperWrapper.displayName = '_Swiper';

export default _SwiperWrapper