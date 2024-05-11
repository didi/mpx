import React from 'react'
import Carouse from './carouse'
import useInnerTouchable from '../getInnerListeners';

/**
 * class="resource-banner-swiper-item"
 * style 获取不到
*/
export const SwiperWrapper = (props) => {
 const {
  children
 } = props
  const onChange = (e) => {
    console.log(e)
  }
  const swiperProp = {
    loop: props.circular,
    index: props.current,
    onIndexChanged: props.onChange,
    autoplay: props.autoplay,
    showsPagination: props.indicatorDots,
    dotColor: props.indicatorColor,
    activeDotColor: props.indicatorActiveColor,
    horizontal: props.vertical !== undefined ? !props.vertical : true,
    onMomentumScrollEnd: props.animationfinish,
    dotStyle: {
      backgroundColor: '#bcbcbc'
    },
    style: props.style,
    easingFunction: props.easingFunction,
    previousMargin: props.previousMargin,
    nextMargin: props.nextMargin
  }
  const innerTouchable = useInnerTouchable({
    ...props
  });
  return (
      <Carouse
        {...swiperProp}
        {...innerTouchable}
      >
        {children}
      </Carouse>

  )
}

export default SwiperWrapper
