/**
 * ✔ hover-class
 * ✘ hover-stop-propagation
 * ✔ hover-start-time
 * ✔ hover-stay-time
 * ✔ open-type
 * ✔ url
 * ✔ delta
 */
import { useCallback, forwardRef, createElement } from 'react';
import { redirectTo, navigateTo, navigateBack, reLaunch, switchTab } from '@mpxjs/api-proxy';
import MpxView from './mpx-view';
const _Navigator = forwardRef((props, ref) => {
    const { children, 'open-type': openType, url = '', delta } = props;
    const handleClick = useCallback(() => {
        switch (openType) {
            case 'navigateBack':
                navigateBack({ delta });
                break;
            case 'redirect':
                redirectTo({ url });
                break;
            case 'switchTab':
                switchTab({ url });
                break;
            case 'reLaunch':
                reLaunch({ url });
                break;
            default:
                navigateTo({ url });
                break;
        }
    }, [openType, url, delta]);
    const innerProps = {
        ref,
        bindtap: handleClick
    };
    return createElement(MpxView, innerProps, children);
});
_Navigator.displayName = 'MpxNavigator';
export default _Navigator;
