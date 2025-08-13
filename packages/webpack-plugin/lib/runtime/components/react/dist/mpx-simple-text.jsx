import { Text } from 'react-native';
import { createElement } from 'react';
import useInnerProps from './getInnerListeners';
import { extendObject } from './utils';
const SimpleText = (props) => {
    const { allowFontScaling = false, children } = props;
    const innerProps = useInnerProps(extendObject({}, props, {
        allowFontScaling
    }));
    return createElement(Text, innerProps, children);
};
SimpleText.displayName = 'MpxSimpleText';
export default SimpleText;
