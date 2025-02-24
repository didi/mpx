import React, { useEffect, useRef, useState, useContext } from 'react';
import { StyleSheet } from 'react-native';
import Animated, { useAnimatedStyle, useSharedValue, withSpring, useAnimatedReaction, runOnJS, useScrollViewOffset } from 'react-native-reanimated';
import { ScrollViewContext } from './context';

export const _StickyHeader = ({ offsetTop = 0, children, onStickOnTopChange, style }) => {
    const [contentHeight, setContentHeight] = useState(0);
    const [headerTop, setHeaderTop] = useState(0);
    const [isSticky, setIsSticky] = useState(false);
    const scrollViewContext = useContext(ScrollViewContext);
    const scrollY = useScrollViewOffset(scrollViewContext.gestureRef);
    const headerRef = useRef(null);
    // Animated value for translation
    const translateY = useSharedValue(0);
    const lastStickyState = useSharedValue(false);
    const animatedStyles = useAnimatedStyle(() => {
  if (headerTop === 0) return { transform: [{ translateY: 0 }] };

  const elementTopToViewport = headerTop - scrollY.value;
  const shouldSticky = elementTopToViewport <= offsetTop;
  const translateY = shouldSticky 
    ? scrollY.value - (headerTop - offsetTop)
    : 0;

  // 状态变化和样式更新在一起，逻辑更清晰
  if (lastStickyState.value !== shouldSticky) {
    lastStickyState.value = shouldSticky;
    if (onStickOnTopChange) {
      runOnJS(onStickOnTopChange)?.(shouldSticky, contentHeight);
    }
  }

  return {
    transform: [{ translateY }],
    zIndex: 10,
  };
});
    // const animatedStyles = useAnimatedStyle(() => {
    //     return {
    //         transform: [{ translateY: translateY.value }],
    //         zIndex: 10,
    //     };
    // });
    // useAnimatedReaction(() => scrollY.value, currentScrollY => {
    //     // 计算元素顶部距离视口顶部的距离
    //     const elementTopToViewport = headerTop - currentScrollY;
    //     // 当元素顶部距离视口顶部的距离小于等于 offsetTop 时触发吸顶
    //     const shouldSticky = elementTopToViewport <= offsetTop;
    //      if (shouldSticky) {
    //     // 计算需要偏移的距离：
    //     // 当前滚动位置 - (header初始位置 - 期望的吸顶位置)
    //     translateY.value = currentScrollY - (headerTop - offsetTop);
    //   } else {
    //     // 不吸顶时回到原始位置
    //     translateY.value = 0;
    //   }
    //     // 更新吸顶状态
    //     if (isSticky !== shouldSticky) {
    //         runOnJS(setIsSticky)(shouldSticky);
    //         if (onStickOnTopChange) {
    //             runOnJS(onStickOnTopChange)(shouldSticky, contentHeight);
    //         }
    //     }
    // }, [headerTop, offsetTop, contentHeight, isSticky]);
    useEffect(() => {
        if (headerRef.current) {
            headerRef.current.measure((x, y, width, height, pageX, pageY) => {
                setContentHeight(height);
                setHeaderTop(pageY);
            });
        }
    }, []);
    return (<Animated.View ref={headerRef} style={[
            style,
            styles.content,
            animatedStyles,
        ]}>
      {React.cloneElement(children, {
            style: Object.assign(children.props.style, styles.fill)
        })}
    </Animated.View>);
};
const styles = StyleSheet.create({
    content: {
        width: '100%',
        boxSizing: 'border-box',
    },
    fill: {
        flex: 1,
    },
});
_StickyHeader.displayName = 'MpxStickyHeader';
export default _StickyHeader;
