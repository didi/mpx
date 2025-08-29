import Animated, { useAnimatedStyle, interpolate } from 'react-native-reanimated';
import { forwardRef, useRef, useContext, createElement } from 'react';
import useInnerProps from './getInnerListeners';
import useNodesRef from './useNodesRef'; // 引入辅助函数
import { useTransformStyle, splitStyle, splitProps, wrapChildren, useLayout, extendObject, isHarmony } from './utils';
import { SwiperContext } from './context';
const _SwiperItem = forwardRef((props, ref) => {
    const { 'enable-var': enableVar, 'external-var-context': externalVarContext, style, customStyle, itemIndex } = props;
    const contextValue = useContext(SwiperContext);
    const offset = contextValue.offset || 0;
    const step = contextValue.step || 0;
    const scale = contextValue.scale || false;
    const dir = contextValue.dir || 'x';
    const { textProps } = splitProps(props);
    const nodeRef = useRef(null);
    const { normalStyle, hasVarDec, varContextRef, hasSelfPercent, setWidth, setHeight } = useTransformStyle(style, { enableVar, externalVarContext });
    const { textStyle, innerStyle } = splitStyle(normalStyle);
    useNodesRef(props, ref, nodeRef, {
        style: normalStyle
    });
    const { 
    // 存储layout布局信息
    layoutRef, layoutProps, layoutStyle } = useLayout({ props, hasSelfPercent, setWidth, setHeight, nodeRef: nodeRef });
    const innerProps = useInnerProps(extendObject({}, props, layoutProps, {
        ref: nodeRef
    }), [
        'children',
        'enable-offset',
        'style'
    ], { layoutRef });
    const itemAnimatedStyle = useAnimatedStyle(() => {
        if (!step.value && !isHarmony)
            return {};
        const inputRange = [step.value, 0];
        const outputRange = [0.7, 1];
        // 实现元素的宽度跟随step从0到真实宽度，且不能触发重新渲染整个组件，通过AnimatedStyle的方式实现
        const outerLayoutStyle = dir === 'x' ? { width: step.value, height: '100%' } : { width: '100%', height: step.value };
        const transformStyle = [];
        if (scale) {
            transformStyle.push({
                scale: interpolate(Math.abs(Math.abs(offset.value) - itemIndex * step.value), inputRange, outputRange)
            });
        }
        return Object.assign(outerLayoutStyle, {
            transform: transformStyle
        });
    });
    const mergeProps = extendObject({}, innerProps, {
        style: [innerStyle, layoutStyle, itemAnimatedStyle, customStyle],
        'data-itemId': props['item-id']
    });
    return createElement(Animated.View, mergeProps, wrapChildren(props, {
        hasVarDec,
        varContext: varContextRef.current,
        textStyle,
        textProps
    }));
});
_SwiperItem.displayName = 'MpxSwiperItem';
export default _SwiperItem;
