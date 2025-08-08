import React, { forwardRef, useRef, useContext, useEffect, createElement } from 'react';
import { StyleSheet, Text, TouchableWithoutFeedback, View } from 'react-native';
import { warn } from '@mpxjs/utils';
import PickerSelector from './selector';
import PickerMultiSelector from './multiSelector';
import PickerTime from './time';
import PickerDate from './date';
import PickerRegion from './region';
import { FormContext, RouteContext } from '../context';
import useNodesRef from '../useNodesRef';
import useInnerProps, { getCustomEvent } from '../getInnerListeners';
import { extendObject, useLayout } from '../utils';
import { createPopupManager } from '../mpx-popup';
/**
 * ✔ mode
 * ✔ disabled
 * ✔ bindcancel
 * ✔ bindchange
 * ✔ range
 * ✔ range-key
 * ✔ value
 * ✔ start
 * ✔ end
 * ✔ fields 有效值 year,month,day，表示选择器的粒度
 * ✔ end
 * ✔ custom-item
 * ✔ level 选择器层级 province，city，region，<sub-district不支持>
 * ✔ level
 * ✔ header-text
 * ✔ bindcolumnchange
 */
const styles = StyleSheet.create({
    header: {
        height: 40,
        alignItems: 'center',
        justifyContent: 'center',
        borderBottomWidth: StyleSheet.hairlineWidth,
        borderBottomColor: '#eeeeee'
    },
    headerText: {
        color: '#333333',
        fontSize: 18,
        textAlign: 'center'
    },
    footer: {
        gap: 20,
        height: 50,
        marginBottom: 20,
        alignItems: 'center',
        flexDirection: 'row',
        justifyContent: 'center'
    },
    footerItem: {
        alignItems: 'center',
        justifyContent: 'center',
        height: 40,
        width: 110,
        borderRadius: 5
    },
    cancelButton: {
        backgroundColor: '#eeeeee'
    },
    confirmButton: {
        backgroundColor: '#1AAD19'
    },
    cancelText: {
        color: 'green',
        fontSize: 18,
        textAlign: 'center'
    },
    confirmText: {
        color: '#FFFFFF',
        fontSize: 18,
        textAlign: 'center'
    }
});
const pickerModalMap = {
    ["selector" /* PickerMode.SELECTOR */]: PickerSelector,
    ["multiSelector" /* PickerMode.MULTI_SELECTOR */]: PickerMultiSelector,
    ["time" /* PickerMode.TIME */]: PickerTime,
    ["date" /* PickerMode.DATE */]: PickerDate,
    ["region" /* PickerMode.REGION */]: PickerRegion
};
const getDefaultValue = (mode) => {
    switch (mode) {
        case "selector" /* PickerMode.SELECTOR */:
        case "multiSelector" /* PickerMode.MULTI_SELECTOR */:
        case "region" /* PickerMode.REGION */:
            return [];
        case "time" /* PickerMode.TIME */:
        case "date" /* PickerMode.DATE */:
        default:
            return '';
    }
};
const buttonTextMap = {
    'zh-CN': {
        cancel: '取消',
        confirm: '确定'
    },
    'en-US': {
        cancel: 'Cancel',
        confirm: 'Confirm'
    }
};
const Picker = forwardRef((props, ref) => {
    const { mode, value, range = null, children, disabled, bindcancel, bindchange, 'header-text': headerText = '' } = props;
    const { pageId } = useContext(RouteContext) || {};
    const buttonText = buttonTextMap[global.__mpx?.i18n?.locale || 'zh-CN'];
    const pickerValue = useRef(value);
    pickerValue.current = Array.isArray(value) ? value.slice() : value;
    const nodeRef = useRef(null);
    const pickerRef = useRef(null);
    const { open, show, hide, remove } = useRef(createPopupManager()).current;
    useNodesRef(props, ref, nodeRef);
    const { layoutRef, layoutProps } = useLayout({
        props,
        hasSelfPercent: false,
        nodeRef
    });
    const innerProps = useInnerProps(extendObject({}, props, {
        ref: nodeRef
    }, layoutProps), [], { layoutRef });
    useEffect(() => {
        if (range && pickerRef.current && mode === "multiSelector" /* PickerMode.MULTI_SELECTOR */) {
            pickerRef.current.updateRange?.(range);
        }
    }, [JSON.stringify(range)]);
    /** --- form 表单组件内部方法 --- */
    const getValue = () => {
        return pickerValue.current;
    };
    const resetValue = () => {
        const defalutValue = getDefaultValue(mode); // 默认值
        pickerRef.current.updateValue?.(defalutValue);
    };
    const formContext = useContext(FormContext);
    let formValuesMap;
    if (formContext) {
        formValuesMap = formContext.formValuesMap;
    }
    if (formValuesMap) {
        if (!props.name) {
            warn('If a form component is used, the name attribute is required.');
        }
        else {
            formValuesMap.set(props.name, { getValue, resetValue });
        }
    }
    useEffect(() => {
        return () => {
            if (formValuesMap && props.name) {
                formValuesMap.delete(props.name);
            }
        };
    }, []);
    /** --- form 表单组件内部方法 --- */
    const onChange = (e) => {
        const { value } = e.detail;
        pickerValue.current = value;
    };
    const onColumnChange = (columnIndex, value) => {
        if (mode !== "multiSelector" /* PickerMode.MULTI_SELECTOR */) {
            return;
        }
        const eventData = getCustomEvent('columnchange', {}, { detail: { column: columnIndex, value }, layoutRef });
        props.bindcolumnchange?.(eventData);
    };
    const onCancel = () => {
        bindcancel?.();
        hide();
    };
    const onConfirm = () => {
        const eventData = getCustomEvent('change', {}, { detail: { value: pickerValue.current }, layoutRef });
        bindchange?.(eventData);
        hide();
    };
    const specificProps = extendObject(innerProps, {
        mode,
        children,
        bindchange: onChange,
        bindcolumnchange: onColumnChange,
        getRange: () => range
    });
    const renderPickerContent = () => {
        if (disabled) {
            return null;
        }
        const _mode = mode ?? "selector" /* PickerMode.SELECTOR */;
        if (!(_mode in pickerModalMap)) {
            return warn(`[Mpx runtime warn]: Unsupported <picker> mode: ${mode}`);
        }
        const _value = value;
        const PickerModal = pickerModalMap[_mode];
        const renderPickerModal = (<>
          {headerText && (<View style={[styles.header]}>
              <Text style={[styles.headerText]}>{headerText}</Text>
            </View>)}
          <PickerModal {...specificProps} value={_value} ref={pickerRef}></PickerModal>
          <View style={[styles.footer]}>
            <View onTouchEnd={onCancel} style={[styles.footerItem, styles.cancelButton]}>
              <Text style={[styles.cancelText]}>{buttonText.cancel}</Text>
            </View>
            <View onTouchEnd={onConfirm} style={[styles.footerItem, styles.confirmButton]}>
              <Text style={[styles.confirmText]}>{buttonText.confirm}</Text>
            </View>
          </View>
        </>);
        const contentHeight = headerText ? 350 : 310;
        open(renderPickerModal, pageId, { contentHeight });
    };
    useEffect(() => {
        renderPickerContent();
        return () => {
            remove();
        };
    }, []);
    return createElement(TouchableWithoutFeedback, { onPress: show }, createElement(View, innerProps, children));
});
Picker.displayName = 'MpxPicker';
export default Picker;
