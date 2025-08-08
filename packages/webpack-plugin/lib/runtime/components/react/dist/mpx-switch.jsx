/**
 * ✔ checked
 * ✔ type
 * ✔ disabled
 * ✔ color
 */
import { Switch } from 'react-native';
import { useRef, useEffect, forwardRef, useState, useContext, createElement } from 'react';
import { warn } from '@mpxjs/utils';
import useNodesRef from './useNodesRef'; // 引入辅助函数
import useInnerProps, { getCustomEvent } from './getInnerListeners';
import CheckBox from './mpx-checkbox';
import Portal from './mpx-portal';
import { FormContext } from './context';
import { useTransformStyle, useLayout, extendObject } from './utils';
const _Switch = forwardRef((props, ref) => {
    const { style = {}, checked = false, type = 'switch', disabled = false, color = '#04BE02', 'enable-var': enableVar, 'external-var-context': externalVarContext, 'parent-font-size': parentFontSize, 'parent-width': parentWidth, 'parent-height': parentHeight, bindchange, catchchange } = props;
    const [isChecked, setIsChecked] = useState(checked);
    const changeHandler = bindchange || catchchange;
    let formValuesMap;
    const formContext = useContext(FormContext);
    if (formContext) {
        formValuesMap = formContext.formValuesMap;
    }
    const { normalStyle, hasSelfPercent, setWidth, setHeight, hasPositionFixed } = useTransformStyle(style, {
        enableVar,
        externalVarContext,
        parentFontSize,
        parentWidth,
        parentHeight
    });
    useEffect(() => {
        setIsChecked(checked);
    }, [checked]);
    const nodeRef = useRef(null);
    useNodesRef(props, ref, nodeRef, {
        style: normalStyle
    });
    const { layoutRef, layoutStyle, layoutProps } = useLayout({ props, hasSelfPercent, setWidth, setHeight, nodeRef });
    const onChange = (evt, { checked } = {}) => {
        if (type === 'switch') {
            setIsChecked(evt);
            changeHandler && changeHandler(getCustomEvent('change', {}, { layoutRef, detail: { value: evt } }, props));
        }
        else {
            setIsChecked(checked);
            changeHandler && changeHandler(getCustomEvent('change', evt, { layoutRef, detail: { value: checked } }, props));
        }
    };
    const resetValue = () => {
        setIsChecked(false);
    };
    const getValue = () => {
        return isChecked;
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
    const innerProps = useInnerProps(extendObject({}, props, layoutProps, {
        ref: nodeRef,
        style: extendObject({}, normalStyle, layoutStyle)
    }, !disabled ? { [type === 'switch' ? 'onValueChange' : '_onChange']: onChange } : {}), [
        'checked',
        'disabled',
        'type',
        'color'
    ], { layoutRef });
    if (type === 'checkbox') {
        return createElement(CheckBox, extendObject({}, innerProps, {
            color: color,
            style: normalStyle,
            checked: isChecked
        }));
    }
    let finalComponent = createElement(Switch, extendObject({}, innerProps, {
        style: normalStyle,
        value: isChecked,
        trackColor: { false: '#FFF', true: color },
        thumbColor: isChecked ? '#FFF' : '#f4f3f4',
        ios_backgroundColor: '#FFF'
    }));
    if (hasPositionFixed) {
        finalComponent = createElement(Portal, null, finalComponent);
    }
    return finalComponent;
});
_Switch.displayName = 'MpxSwitch';
export default _Switch;
