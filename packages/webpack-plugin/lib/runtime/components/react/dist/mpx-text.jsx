/**
 * ✔ selectable
 * ✘ space
 * ✘ decode
 */
import { Text } from 'react-native';
import { useRef, forwardRef, createElement } from 'react';
import Portal from './mpx-portal';
import useInnerProps from './getInnerListeners';
import useNodesRef from './useNodesRef'; // 引入辅助函数
import { useTransformStyle, wrapChildren, extendObject } from './utils';
const _Text = forwardRef((props, ref) => {
    const { style = {}, allowFontScaling = false, selectable, 'enable-var': enableVar, 'external-var-context': externalVarContext, 'user-select': userSelect, 'parent-font-size': parentFontSize, 'parent-width': parentWidth, 'parent-height': parentHeight } = props;
    const { normalStyle, hasVarDec, varContextRef, hasPositionFixed } = useTransformStyle(style, {
        enableVar,
        externalVarContext,
        parentFontSize,
        parentWidth,
        parentHeight
    });
    const nodeRef = useRef(null);
    useNodesRef(props, ref, nodeRef, {
        style: normalStyle
    });
    const innerProps = useInnerProps(extendObject({}, props, {
        ref: nodeRef,
        style: normalStyle,
        selectable: !!selectable || !!userSelect,
        allowFontScaling
    }), [
        'user-select'
    ]);
    let finalComponent = createElement(Text, innerProps, wrapChildren(props, {
        hasVarDec,
        varContext: varContextRef.current
    }));
    if (hasPositionFixed) {
        finalComponent = createElement(Portal, null, finalComponent);
    }
    return finalComponent;
});
_Text.displayName = 'MpxText';
export default _Text;
