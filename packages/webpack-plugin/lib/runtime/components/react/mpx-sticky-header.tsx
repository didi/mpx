import React, { useEffect, useRef, useState, useContext } from 'react';
import { StyleSheet } from 'react-native';
import Animated, { useAnimatedStyle, useSharedValue, withSpring, useAnimatedReaction, runOnJS, useScrollViewOffset } from 'react-native-reanimated';
import { ScrollViewContext } from './context';
export const _StickyHeader = ({ offsetTop = 0, children, onStickOnTopChange }) => {
    const [contentHeight, setContentHeight] = useState(0);
    const [headerTop, setHeaderTop] = useState(0);
    const [isSticky, setIsSticky] = useState(false);
    const scrollViewContext = useContext(ScrollViewContext);
    const scrollY = useScrollViewOffset(scrollViewContext.gestureRef);
    const headerRef = useRef(null);
    // Animated value for translation
    const translateY = useSharedValue(0);
    const animatedStyles = useAnimatedStyle(() => {
        return {
            transform: [{ translateY: translateY.value }],
        };
    });
    useAnimatedReaction(() => scrollY.value, currentScrollY => {
        // 计算元素顶部距离视口顶部的距离
        const elementTopToViewport = headerTop - currentScrollY;
        // 当元素顶部距离视口顶部的距离小于等于 offsetTop 时触发吸顶
        const shouldSticky = elementTopToViewport <= offsetTop;
        if (shouldSticky) {
            // 计算需要偏移的距离：
            // 当前滚动位置 - (header初始位置 - 期望的吸顶位置)
            translateY.value = withSpring(currentScrollY - (headerTop - offsetTop));
        }
        else {
            // 不吸顶时回到原始位置
            translateY.value = withSpring(0);
        }
        // 更新吸顶状态
        if (isSticky !== shouldSticky) {
            runOnJS(setIsSticky)(shouldSticky);
            if (onStickOnTopChange) {
                runOnJS(onStickOnTopChange)(shouldSticky, contentHeight);
            }
        }
    }, [headerTop, offsetTop, contentHeight, isSticky]);
    useEffect(() => {
        if (headerRef.current) {
            headerRef.current.measure((x, y, width, height, pageX, pageY) => {
                setContentHeight(height);
                setHeaderTop(pageY);
            });
        }
    }, []);
    return (<Animated.View ref={headerRef} style={[
            styles.content,
            animatedStyles,
        ]}>
      {React.cloneElement(children, {
            style: styles.fill,
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
