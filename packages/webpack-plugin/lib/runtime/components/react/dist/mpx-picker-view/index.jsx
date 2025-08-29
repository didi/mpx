import { View } from 'react-native';
import React, { createElement, forwardRef, useRef } from 'react';
import useInnerProps, { getCustomEvent } from '../getInnerListeners';
import useNodesRef from '../useNodesRef';
import { useLayout, splitProps, splitStyle, wrapChildren, useTransformStyle, extendObject } from '../utils';
import { PickerViewStyleContext } from './pickerVIewContext';
import Portal from '../mpx-portal';
const styles = {
    wrapper: {
        display: 'flex',
        flex: 1,
        flexDirection: 'row',
        justifyContent: 'space-around',
        overflow: 'hidden',
        alignItems: 'center'
    }
};
const DefaultPickerItemH = 36;
const _PickerView = forwardRef((props, ref) => {
    const { children, value = [], bindchange, style, 'indicator-style': indicatorStyle = {}, 'mask-style': pickerMaskStyle = {}, 'enable-var': enableVar, 'external-var-context': externalVarContext } = props;
    const { height: indicatorH, ...pickerIndicatorStyle } = indicatorStyle;
    const nodeRef = useRef(null);
    const cloneRef = useRef(null);
    const activeValueRef = useRef(value);
    activeValueRef.current = value.slice();
    const snapActiveValueRef = useRef(null);
    const { normalStyle, hasVarDec, varContextRef, hasSelfPercent, setWidth, setHeight, hasPositionFixed } = useTransformStyle(style, { enableVar, externalVarContext });
    useNodesRef(props, ref, nodeRef, {
        style: normalStyle
    });
    const { layoutRef, layoutProps, layoutStyle } = useLayout({ props, hasSelfPercent, setWidth, setHeight, nodeRef: nodeRef });
    const { textProps } = splitProps(props);
    const { textStyle } = splitStyle(normalStyle);
    const onSelectChange = (columnIndex, selectedIndex) => {
        const activeValue = activeValueRef.current;
        activeValue[columnIndex] = selectedIndex;
        const eventData = getCustomEvent('change', {}, { detail: { value: activeValue.slice(), source: 'change' }, layoutRef });
        bindchange?.(eventData);
        snapActiveValueRef.current = activeValueRef.current;
    };
    const hasDiff = (a = [], b) => {
        return a.some((v, i) => v !== b[i]);
    };
    const onInitialChange = (isInvalid, value) => {
        if (isInvalid || !snapActiveValueRef.current || hasDiff(snapActiveValueRef.current, value)) {
            const eventData = getCustomEvent('change', {}, { detail: { value: value.slice(), source: 'change' }, layoutRef });
            bindchange?.(eventData);
            snapActiveValueRef.current = value.slice();
        }
    };
    const innerProps = useInnerProps(extendObject({}, props, layoutProps, {
        ref: nodeRef,
        style: extendObject({}, normalStyle, layoutStyle, {
            position: 'relative',
            overflow: 'hidden'
        })
    }), [
        'enable-offset',
        'indicator-style',
        'indicator-class',
        'mask-style',
        'mask-class'
    ], { layoutRef });
    const renderColumn = (child, index, columnData, initialIndex) => {
        const childProps = child?.props || {};
        const wrappedProps = extendObject({}, childProps, {
            columnData,
            ref: cloneRef,
            columnIndex: index,
            key: `pick-view-${index}`,
            wrapperStyle: {
                height: normalStyle?.height || DefaultPickerItemH,
                itemHeight: indicatorH || DefaultPickerItemH
            },
            onSelectChange: onSelectChange.bind(null, index),
            initialIndex,
            pickerIndicatorStyle,
            pickerMaskStyle
        });
        const realElement = React.cloneElement(child, wrappedProps);
        return wrapChildren({
            children: realElement
        }, {
            hasVarDec,
            varContext: varContextRef.current,
            textStyle,
            textProps
        });
    };
    const validateChildInitialIndex = (index, data) => {
        return Math.max(0, Math.min(value[index] || 0, data.length - 1));
    };
    const flatColumnChildren = (data) => {
        const columnData = React.Children.toArray(data?.props?.children);
        if (columnData.length === 1 && React.isValidElement(columnData[0]) && columnData[0].type === React.Fragment) {
            // 只有一个 Fragment 嵌套情况
            return React.Children.toArray(columnData[0].props.children);
        }
        return columnData;
    };
    const renderPickerColumns = () => {
        const columns = React.Children.toArray(children);
        const renderColumns = [];
        const validValue = [];
        let isInvalid = false;
        columns.forEach((item, index) => {
            const columnData = flatColumnChildren(item);
            const validIndex = validateChildInitialIndex(index, columnData);
            if (validIndex !== value[index]) {
                isInvalid = true;
            }
            validValue.push(validIndex);
            renderColumns.push(renderColumn(item, index, columnData, validIndex));
        });
        onInitialChange(isInvalid, validValue);
        return renderColumns;
    };
    const finalComponent = createElement(PickerViewStyleContext.Provider, { value: textStyle }, createElement(View, innerProps, createElement(View, { style: [styles.wrapper] }, renderPickerColumns())));
    if (hasPositionFixed) {
        return createElement(Portal, null, finalComponent);
    }
    return finalComponent;
});
_PickerView.displayName = 'MpxPickerView';
export default _PickerView;
