import { useRef, forwardRef, createElement, useCallback, useMemo } from 'react';
import { View } from 'react-native';
import useNodesRef from './useNodesRef';
import { splitProps, splitStyle, useTransformStyle, wrapChildren, useLayout, extendObject } from './utils';
import { StickyContext } from './context';
import useInnerProps from './getInnerListeners';
const _StickySection = forwardRef((stickySectionProps = {}, ref) => {
    const { textProps, innerProps: props = {} } = splitProps(stickySectionProps);
    const { style, 'enable-var': enableVar, 'external-var-context': externalVarContext, 'parent-font-size': parentFontSize, 'parent-width': parentWidth, 'parent-height': parentHeight } = props;
    const sectionRef = useRef(null);
    const { normalStyle, hasVarDec, varContextRef, hasSelfPercent, setWidth, setHeight } = useTransformStyle(style, { enableVar, externalVarContext, parentFontSize, parentWidth, parentHeight });
    const { layoutRef, layoutProps, layoutStyle } = useLayout({ props, hasSelfPercent, setWidth, setHeight, nodeRef: sectionRef, onLayout });
    const { textStyle, innerStyle = {} } = splitStyle(normalStyle);
    const stickyHeaders = useRef(new Map());
    const registerStickyHeader = useCallback((item) => {
        stickyHeaders.current.set(item.id, item);
    }, []);
    const unregisterStickyHeader = useCallback((id) => {
        stickyHeaders.current.delete(id);
    }, []);
    const contextValue = useMemo(() => ({
        registerStickyHeader,
        unregisterStickyHeader
    }), []);
    useNodesRef(props, ref, sectionRef, {
        style: normalStyle
    });
    function onLayout() {
        stickyHeaders.current.forEach(item => {
            item.updatePosition();
        });
    }
    const innerProps = useInnerProps(extendObject({}, props, {
        style: extendObject(innerStyle, layoutStyle),
        ref: sectionRef
    }, layoutProps), [], { layoutRef });
    return (createElement(View, innerProps, createElement(StickyContext.Provider, { value: contextValue }, wrapChildren(props, {
        hasVarDec,
        varContext: varContextRef.current,
        textStyle,
        textProps
    }))));
});
_StickySection.displayName = 'MpxStickySection';
export default _StickySection;
