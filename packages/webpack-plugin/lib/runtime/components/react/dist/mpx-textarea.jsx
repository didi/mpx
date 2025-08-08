/**
 * Compared with Input:
 *   Subtraction:
 *     type, password, confirm-hold
 *   Addition:
 *     ✔ confirm-type
 *     ✔ auto-height
 *     ✘ fixed
 *     ✘ show-confirm-bar
 *     ✔ bindlinechange: No `heightRpx` info.
 */
import { forwardRef, createElement } from 'react';
import Input from './mpx-input';
import { omit, extendObject } from './utils';
const DEFAULT_TEXTAREA_WIDTH = 300;
const DEFAULT_TEXTAREA_HEIGHT = 150;
const Textarea = forwardRef((props, ref) => {
    const { style = {}, 'confirm-type': confirmType = 'return' } = props;
    const restProps = omit(props, [
        'ref',
        'type',
        'style',
        'password',
        'multiline',
        'confirm-type',
        'confirm-hold'
    ]);
    return createElement(Input, extendObject(restProps, {
        ref,
        confirmType,
        multiline: true,
        'confirm-type': confirmType,
        style: extendObject({
            width: DEFAULT_TEXTAREA_WIDTH,
            height: DEFAULT_TEXTAREA_HEIGHT
        }, style)
    }));
});
Textarea.displayName = 'MpxTextarea';
export default Textarea;
