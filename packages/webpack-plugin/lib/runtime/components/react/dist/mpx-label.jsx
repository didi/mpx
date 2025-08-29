/**
 * ✘ for
 */
import { useRef, forwardRef, useCallback, createElement } from 'react';
import { View } from 'react-native';
import { noop, warn } from '@mpxjs/utils';
import useInnerProps, { getCustomEvent } from './getInnerListeners';
import useNodesRef from './useNodesRef';
import { splitProps, splitStyle, useLayout, useTransformStyle, wrapChildren, extendObject } from './utils';
import { LabelContext } from './context';
import Portal from './mpx-portal';
const Label = forwardRef((labelProps, ref) => {
    const { textProps, innerProps: props = {} } = splitProps(labelProps);
    const propsRef = useRef({});
    const { style = {}, 'enable-var': enableVar, 'external-var-context': externalVarContext, 'parent-font-size': parentFontSize, 'parent-width': parentWidth, 'parent-height': parentHeight } = props;
    propsRef.current = props;
    const defaultStyle = {
        flexDirection: 'row'
    };
    const styleObj = extendObject({}, defaultStyle, style);
    const { hasPositionFixed, hasSelfPercent, normalStyle, hasVarDec, varContextRef, setWidth, setHeight } = useTransformStyle(styleObj, { enableVar, externalVarContext, parentFontSize, parentWidth, parentHeight });
    const nodeRef = useRef(null);
    useNodesRef(props, ref, nodeRef, { style: normalStyle });
    const { layoutRef, layoutStyle, layoutProps } = useLayout({ props, hasSelfPercent, setWidth, setHeight, nodeRef });
    const { textStyle, backgroundStyle, innerStyle = {} } = splitStyle(normalStyle);
    if (backgroundStyle) {
        warn('Label does not support background image-related styles!');
    }
    const contextRef = useRef({
        triggerChange: noop
    });
    const onTap = useCallback((evt) => {
        const { bindtap } = propsRef.current;
        bindtap && bindtap(getCustomEvent('tap', evt, { layoutRef }, { props: propsRef.current }));
        contextRef.current.triggerChange(evt);
    }, []);
    const innerProps = useInnerProps(extendObject({}, props, layoutProps, {
        ref: nodeRef,
        style: extendObject({}, innerStyle, layoutStyle),
        bindtap: onTap
    }), [], {
        layoutRef
    });
    const finalComponent = createElement(View, innerProps, createElement(LabelContext.Provider, { value: contextRef }, wrapChildren(props, {
        hasVarDec,
        varContext: varContextRef.current,
        textStyle,
        textProps
    })));
    if (hasPositionFixed) {
        return createElement(Portal, null, finalComponent);
    }
    return finalComponent;
});
Label.displayName = 'MpxLabel';
export default Label;
