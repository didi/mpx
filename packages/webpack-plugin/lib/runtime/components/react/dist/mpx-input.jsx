/**
 * ✔ value
 * - type: Partially. Not support `safe-password`、`nickname`
 * ✔ password
 * ✔ placeholder
 * - placeholder-style: Only support color.
 * - placeholder-class: Only support color.
 * ✔ disabled
 * ✔ maxlength
 * ✔ cursor-spacing
 * ✔ auto-focus
 * ✔ focus
 * ✔ confirm-type
 * ✘ always-embed
 * ✔ confirm-hold
 * ✔ cursor
 * ✔ cursor-color
 * ✔ selection-start
 * ✔ selection-end
 * ✔ adjust-position
 * ✘ hold-keyboard
 * ✘ safe-password-cert-path
 * ✘ safe-password-length
 * ✘ safe-password-time-stamp
 * ✘ safe-password-nonce
 * ✘ safe-password-salt
 * ✘ safe-password-custom-hash
 * - bindinput: No `keyCode` info.
 * - bindfocus: No `height` info.
 * - bindblur: No `encryptedValue`、`encryptError` info.
 * ✔ bindconfirm
 * ✘ bindkeyboardheightchange
 * ✘ bindnicknamereview
 * ✔ bind:selectionchange
 * ✘ bind:keyboardcompositionstart
 * ✘ bind:keyboardcompositionupdate
 * ✘ bind:keyboardcompositionend
 * ✘ bind:onkeyboardheightchange
 */
import { forwardRef, useRef, useState, useContext, useEffect, createElement } from 'react';
import { TextInput } from 'react-native';
import { warn } from '@mpxjs/utils';
import { useUpdateEffect, useTransformStyle, useLayout, extendObject, isIOS } from './utils';
import useInnerProps, { getCustomEvent } from './getInnerListeners';
import useNodesRef from './useNodesRef';
import { FormContext, KeyboardAvoidContext } from './context';
import Portal from './mpx-portal';
const keyboardTypeMap = {
    text: 'default',
    number: 'numeric',
    idcard: 'default',
    digit: isIOS ? 'decimal-pad' : 'numeric'
};
const Input = forwardRef((props, ref) => {
    const { style = {}, allowFontScaling = false, type = 'text', value, password, 'placeholder-style': placeholderStyle = {}, disabled, maxlength = 140, 'cursor-spacing': cursorSpacing = 0, 'auto-focus': autoFocus, focus, 'confirm-type': confirmType = 'done', 'confirm-hold': confirmHold = false, cursor, 'cursor-color': cursorColor, 'selection-start': selectionStart = -1, 'selection-end': selectionEnd = -1, 'enable-var': enableVar, 'external-var-context': externalVarContext, 'parent-font-size': parentFontSize, 'parent-width': parentWidth, 'parent-height': parentHeight, 'adjust-position': adjustPosition = true, bindinput, bindfocus, bindblur, bindconfirm, bindselectionchange, 
    // private
    multiline, 'auto-height': autoHeight, bindlinechange } = props;
    const formContext = useContext(FormContext);
    const keyboardAvoid = useContext(KeyboardAvoidContext);
    let formValuesMap;
    if (formContext) {
        formValuesMap = formContext.formValuesMap;
    }
    const parseValue = (value) => {
        if (typeof value === 'string') {
            if (value.length > maxlength && maxlength >= 0) {
                return value.slice(0, maxlength);
            }
            return value;
        }
        if (typeof value === 'number')
            return value + '';
        return '';
    };
    const keyboardType = keyboardTypeMap[type];
    const defaultValue = parseValue(value);
    const textAlignVertical = multiline ? 'top' : 'auto';
    const tmpValue = useRef(defaultValue);
    const cursorIndex = useRef(0);
    const lineCount = useRef(0);
    const [inputValue, setInputValue] = useState(defaultValue);
    const [contentHeight, setContentHeight] = useState(0);
    const [selection, setSelection] = useState({ start: -1, end: tmpValue.current.length });
    const styleObj = extendObject({ padding: 0, backgroundColor: '#fff' }, style, multiline && autoHeight
        ? { height: 'auto', minHeight: Math.max(style?.minHeight || 35, contentHeight) }
        : {});
    const { hasPositionFixed, hasSelfPercent, normalStyle, setWidth, setHeight } = useTransformStyle(styleObj, { enableVar, externalVarContext, parentFontSize, parentWidth, parentHeight });
    const nodeRef = useRef(null);
    useNodesRef(props, ref, nodeRef, {
        style: normalStyle
    });
    const { layoutRef, layoutStyle, layoutProps } = useLayout({ props, hasSelfPercent, setWidth, setHeight, nodeRef });
    useEffect(() => {
        if (value !== tmpValue.current) {
            const parsed = parseValue(value);
            tmpValue.current = parsed;
            setInputValue(parsed);
        }
    }, [value]);
    useEffect(() => {
        if (selectionStart > -1) {
            setSelection({ start: selectionStart, end: selectionEnd === -1 ? tmpValue.current.length : selectionEnd });
        }
        else if (typeof cursor === 'number') {
            setSelection({ start: cursor, end: cursor });
        }
    }, [cursor, selectionStart, selectionEnd]);
    // have not selection on the Android platformg
    const getCursorIndex = (changedSelection, prevValue, curValue) => {
        if (changedSelection)
            return changedSelection.end;
        if (!prevValue || !curValue || prevValue.length === curValue.length)
            return curValue.length;
        const prevStr = prevValue.substring(cursorIndex.current);
        const curStr = curValue.substring(cursorIndex.current);
        return cursorIndex.current + curStr.length - prevStr.length;
    };
    const onChange = (evt) => {
        const { text, selection } = evt.nativeEvent;
        // will trigger twice on the Android platformg, prevent the second trigger
        if (tmpValue.current === text)
            return;
        const index = getCursorIndex(selection, tmpValue.current, text);
        tmpValue.current = text;
        cursorIndex.current = index;
        if (bindinput) {
            const result = bindinput(getCustomEvent('input', evt, {
                detail: {
                    value: tmpValue.current,
                    cursor: cursorIndex.current
                },
                layoutRef
            }, props));
            if (typeof result === 'string') {
                tmpValue.current = result;
                setInputValue(result);
            }
            else {
                setInputValue(tmpValue.current);
            }
        }
        else {
            setInputValue(tmpValue.current);
        }
    };
    const setKeyboardAvoidContext = () => {
        if (adjustPosition && keyboardAvoid) {
            keyboardAvoid.current = { cursorSpacing, ref: nodeRef };
        }
    };
    const onTouchStart = () => {
        // sometimes the focus event occurs later than the keyboardWillShow event
        setKeyboardAvoidContext();
    };
    const onTouchEnd = (evt) => {
        evt.nativeEvent.origin = 'input';
    };
    const onFocus = (evt) => {
        setKeyboardAvoidContext();
        bindfocus && bindfocus(getCustomEvent('focus', evt, {
            detail: {
                value: tmpValue.current || ''
            },
            layoutRef
        }, props));
    };
    const onBlur = (evt) => {
        bindblur && bindblur(getCustomEvent('blur', evt, {
            detail: {
                value: tmpValue.current || '',
                cursor: cursorIndex.current
            },
            layoutRef
        }, props));
    };
    const onSubmitEditing = (evt) => {
        bindconfirm(getCustomEvent('confirm', evt, {
            detail: {
                value: tmpValue.current || ''
            },
            layoutRef
        }, props));
    };
    const onSelectionChange = (evt) => {
        const { selection } = evt.nativeEvent;
        const { start, end } = selection;
        cursorIndex.current = start;
        setSelection(selection);
        bindselectionchange && bindselectionchange(getCustomEvent('selectionchange', evt, {
            detail: {
                selectionStart: start,
                selectionEnd: end
            },
            layoutRef
        }, props));
    };
    const onContentSizeChange = (evt) => {
        const { width, height } = evt.nativeEvent.contentSize;
        if (width && height) {
            if (!multiline || !autoHeight || height === contentHeight)
                return;
            lineCount.current += height > contentHeight ? 1 : -1;
            const lineHeight = lineCount.current === 0 ? 0 : height / lineCount.current;
            bindlinechange &&
                bindlinechange(getCustomEvent('linechange', evt, {
                    detail: {
                        height,
                        lineHeight,
                        lineCount: lineCount.current
                    },
                    layoutRef
                }, props));
            setContentHeight(height);
        }
    };
    const resetValue = () => {
        tmpValue.current = '';
        setInputValue('');
    };
    const getValue = () => {
        return inputValue;
    };
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
    useEffect(() => {
        if (focus) {
            setKeyboardAvoidContext();
        }
    }, [focus]);
    useUpdateEffect(() => {
        if (!nodeRef?.current) {
            return;
        }
        focus
            ? nodeRef.current?.focus()
            : nodeRef.current?.blur();
    }, [focus]);
    const innerProps = useInnerProps(extendObject({}, props, layoutProps, {
        ref: nodeRef,
        style: extendObject({}, normalStyle, layoutStyle),
        allowFontScaling,
        keyboardType: keyboardType,
        secureTextEntry: !!password,
        defaultValue: defaultValue,
        value: inputValue,
        maxLength: maxlength === -1 ? undefined : maxlength,
        editable: !disabled,
        autoFocus: !!autoFocus || !!focus,
        selection: selectionStart > -1 || typeof cursor === 'number' ? selection : undefined,
        selectionColor: cursorColor,
        blurOnSubmit: !multiline && !confirmHold,
        underlineColorAndroid: 'rgba(0,0,0,0)',
        textAlignVertical: textAlignVertical,
        placeholderTextColor: placeholderStyle?.color,
        multiline: !!multiline,
        onTouchStart,
        onTouchEnd,
        onFocus,
        onBlur,
        onChange,
        onSelectionChange,
        onContentSizeChange,
        onSubmitEditing: bindconfirm && !multiline && onSubmitEditing
    }, !!multiline && confirmType === 'return' ? {} : { enterKeyHint: confirmType }), [
        'type',
        'password',
        'placeholder-style',
        'disabled',
        'auto-focus',
        'focus',
        'confirm-type',
        'confirm-hold',
        'cursor',
        'cursor-color',
        'selection-start',
        'selection-end'
    ], {
        layoutRef
    });
    const finalComponent = createElement(TextInput, innerProps);
    if (hasPositionFixed) {
        return createElement(Portal, null, finalComponent);
    }
    return finalComponent;
});
Input.displayName = 'MpxInput';
export default Input;
