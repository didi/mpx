/**
 * ✘ scale-area
 */
import { View } from 'react-native';
import { forwardRef, useRef, useMemo, createElement } from 'react';
import useNodesRef from './useNodesRef';
import useInnerProps from './getInnerListeners';
import { MovableAreaContext } from './context';
import { useTransformStyle, wrapChildren, useLayout, extendObject } from './utils';
import Portal from './mpx-portal';
const _MovableArea = forwardRef((props, ref) => {
    const { style = {}, 'enable-var': enableVar, 'external-var-context': externalVarContext, 'parent-font-size': parentFontSize, 'parent-width': parentWidth, 'parent-height': parentHeight } = props;
    const { hasSelfPercent, normalStyle, hasVarDec, varContextRef, hasPositionFixed, setWidth, setHeight } = useTransformStyle(style, { enableVar, externalVarContext, parentFontSize, parentWidth, parentHeight });
    const movableViewRef = useRef(null);
    useNodesRef(props, ref, movableViewRef, {
        style: normalStyle
    });
    const contextValue = useMemo(() => ({
        height: normalStyle.height || 10,
        width: normalStyle.width || 10
    }), [normalStyle.width, normalStyle.height]);
    const { layoutRef, layoutStyle, layoutProps } = useLayout({ props, hasSelfPercent, setWidth, setHeight, nodeRef: movableViewRef });
    const innerProps = useInnerProps(extendObject({}, props, layoutProps, {
        style: extendObject({ height: contextValue.height, width: contextValue.width }, normalStyle, layoutStyle),
        ref: movableViewRef
    }), [], { layoutRef });
    let movableComponent = createElement(MovableAreaContext.Provider, { value: contextValue }, createElement(View, innerProps, wrapChildren(props, {
        hasVarDec,
        varContext: varContextRef.current
    })));
    if (hasPositionFixed) {
        movableComponent = createElement(Portal, null, movableComponent);
    }
    return movableComponent;
});
_MovableArea.displayName = 'MpxMovableArea';
export default _MovableArea;
