/**
 * ✔ enable
 */
import { createElement, Fragment } from 'react';
import Portal from './mpx-portal/index';
import { warn } from '@mpxjs/utils';
const _RootPortal = (props) => {
    const { children, enable = true } = props;
    if (props.style) {
        warn('The root-portal component does not support the style prop.');
    }
    return enable
        ? createElement(Portal, null, children)
        : createElement(Fragment, null, children);
};
_RootPortal.displayName = 'MpxRootPortal';
export default _RootPortal;
