import { View } from 'react-native';
import { createElement } from 'react';
import { splitProps, splitStyle, wrapChildren, extendObject } from './utils';
import useInnerProps from './getInnerListeners';
const SimpleView = (simpleViewProps) => {
    const { textProps, innerProps: props = {} } = splitProps(simpleViewProps);
    const { textStyle, innerStyle = {} } = splitStyle(props.style || {});
    const innerProps = useInnerProps(extendObject({}, props, {
        style: innerStyle
    }));
    return createElement(View, innerProps, wrapChildren(props, {
        hasVarDec: false,
        textStyle: textStyle,
        textProps
    }));
};
SimpleView.displayName = 'MpxSimpleView';
export default SimpleView;
