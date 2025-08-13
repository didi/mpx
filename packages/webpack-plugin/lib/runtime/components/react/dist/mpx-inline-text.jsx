import { Text } from 'react-native';
import { createElement } from 'react';
import { extendObject } from './utils';
const InlineText = (props) => {
    const { allowFontScaling = false } = props;
    return createElement(Text, extendObject({}, props, {
        allowFontScaling
    }));
};
InlineText.displayName = 'MpxInlineText';
export default InlineText;
