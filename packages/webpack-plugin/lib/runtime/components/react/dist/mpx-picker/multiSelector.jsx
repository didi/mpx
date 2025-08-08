import React, { forwardRef, useCallback, useImperativeHandle, useRef, useState } from 'react';
import { StyleSheet, Text } from 'react-native';
import MpxPickerView from '../mpx-picker-view';
import MpxPickerViewColumn from '../mpx-picker-view-column';
const styles = StyleSheet.create({
    pickerContainer: {
        height: 240,
        paddingHorizontal: 10,
        borderTopLeftRadius: 10,
        borderTopRightRadius: 10
    },
    pickerIndicator: {
        height: 45
    },
    pickerItem: {
        fontSize: 18,
        lineHeight: 45,
        textAlign: 'center'
    }
});
const formatRangeFun = (range, rangeKey = '') => rangeKey ? range.map((item) => item[rangeKey]) : range;
const formatValueFn = (value) => {
    return Array.isArray(value) ? value : [value];
};
const hasDiff = (a, b) => {
    return a.length !== b.length || a.some((item, index) => item !== b[index]);
};
const PickerMultiSelector = forwardRef((props, ref) => {
    const { value = [], range = [], bindchange, bindcolumnchange } = props;
    const _value = formatValueFn(value);
    const [formatValue, setFormatValue] = useState(_value);
    const [formatRange, setFormatRange] = useState(formatRangeFun(range, props['range-key']));
    const nodeRef = useRef(null);
    const updateValue = useCallback((value = []) => {
        let newValue = formatValueFn(value);
        if (newValue.length === 0) {
            newValue = formatValue.map(() => 0);
        }
        checkColumnChange(newValue, formatValue);
        if (hasDiff(newValue, formatValue)) {
            setFormatValue(newValue);
        }
    }, [formatValue]);
    const updateRange = (newRange) => {
        const range = formatRangeFun(newRange.slice(), props['range-key']);
        setFormatRange(range);
    };
    const _props = useRef(props);
    _props.current = props;
    useImperativeHandle(ref, () => ({
        updateValue,
        updateRange,
        getNodeInstance: () => ({
            props: _props,
            nodeRef,
            instance: {
                style: {}
            }
        })
    }));
    const onChange = (e) => {
        const { value } = e.detail;
        checkColumnChange(value, formatValue);
        bindchange?.({ detail: { value: value } });
        if (hasDiff(value, formatValue)) {
            setFormatValue(value.slice());
        }
    };
    const checkColumnChange = (value, formatValue) => {
        const index = value.findIndex((v, i) => v !== formatValue[i]);
        if (index !== -1) {
            bindcolumnchange?.(index, value[index]);
        }
    };
    const renderColumn = (columnData, index) => {
        return (
        // @ts-expect-error ignore
        <MpxPickerViewColumn key={index}>
        {columnData.map((item, index) => (<Text key={index} style={styles.pickerItem}>{item}</Text>))}
      </MpxPickerViewColumn>);
    };
    return (<MpxPickerView style={styles.pickerContainer} indicator-style={styles.pickerIndicator} value={formatValue} bindchange={onChange}>
      {formatRange.map((item, index) => (renderColumn(item, index)))}
    </MpxPickerView>);
});
PickerMultiSelector.displayName = 'MpxPickerMultiSelector';
export default PickerMultiSelector;
