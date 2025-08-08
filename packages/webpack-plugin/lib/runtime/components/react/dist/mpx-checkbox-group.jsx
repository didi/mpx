/**
 * ✔ bindchange
 */
import { useRef, forwardRef, useContext, useMemo, useEffect, createElement } from 'react';
import { View } from 'react-native';
import { warn } from '@mpxjs/utils';
import { FormContext, CheckboxGroupContext } from './context';
import useInnerProps, { getCustomEvent } from './getInnerListeners';
import useNodesRef from './useNodesRef';
import { useLayout, useTransformStyle, wrapChildren, extendObject } from './utils';
import Portal from './mpx-portal';
const CheckboxGroup = forwardRef((props, ref) => {
    const propsRef = useRef({});
    propsRef.current = props;
    const { style = {}, 'enable-var': enableVar, 'external-var-context': externalVarContext, 'parent-font-size': parentFontSize, 'parent-width': parentWidth, 'parent-height': parentHeight } = props;
    const formContext = useContext(FormContext);
    let formValuesMap;
    if (formContext) {
        formValuesMap = formContext.formValuesMap;
    }
    const groupValue = useRef({}).current;
    const defaultStyle = {
        flexDirection: 'row',
        flexWrap: 'wrap'
    };
    const styleObj = extendObject({}, defaultStyle, style);
    const { hasPositionFixed, hasSelfPercent, normalStyle, hasVarDec, varContextRef, setWidth, setHeight } = useTransformStyle(styleObj, { enableVar, externalVarContext, parentFontSize, parentWidth, parentHeight });
    const nodeRef = useRef(null);
    useNodesRef(props, ref, nodeRef, { style: normalStyle });
    const { layoutRef, layoutStyle, layoutProps } = useLayout({ props, hasSelfPercent, setWidth, setHeight, nodeRef });
    const getValue = () => {
        const arr = [];
        for (const key in groupValue) {
            if (groupValue[key].checked) {
                arr.push(key);
            }
        }
        return arr;
    };
    const resetValue = () => {
        Object.keys(groupValue).forEach((key) => {
            groupValue[key].checked = false;
            groupValue[key].setValue(false);
        });
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
    }), [
        'name'
    ], {
        layoutRef
    });
    const contextValue = useMemo(() => {
        const notifyChange = (evt) => {
            const { bindchange } = propsRef.current;
            bindchange &&
                bindchange(getCustomEvent('tap', evt, {
                    layoutRef,
                    detail: {
                        value: getValue()
                    }
                }, propsRef.current));
        };
        return {
            groupValue,
            notifyChange
        };
    }, []);
    const finalComponent = createElement(View, innerProps, createElement(CheckboxGroupContext.Provider, { value: contextValue }, wrapChildren(props, {
        hasVarDec,
        varContext: varContextRef.current
    })));
    if (hasPositionFixed) {
        return createElement(Portal, null, finalComponent);
    }
    return finalComponent;
});
CheckboxGroup.displayName = 'MpxCheckboxGroup';
export default CheckboxGroup;
