import { useContext, useEffect, useRef } from 'react';
import { PortalContext, RouteContext, VarContext } from '../context';
import PortalHost, { portal } from './portal-host';
const Portal = ({ children }) => {
    const manager = useContext(PortalContext);
    const keyRef = useRef(null);
    const { pageId } = useContext(RouteContext) || {};
    const varContext = useContext(VarContext);
    if (varContext) {
        children = (<VarContext.Provider value={varContext} key='varContextWrap'>{children}</VarContext.Provider>);
    }
    useEffect(() => {
        manager.update(keyRef.current, children);
    }, [children]);
    useEffect(() => {
        if (!manager) {
            throw new Error('Looks like you forgot to wrap your root component with `PortalHost` component from `@mpxjs/webpack-plugin/lib/runtime/components/react/dist/mpx-portal/index`.\n\n');
        }
        keyRef.current = manager.mount(children, null, pageId);
        return () => {
            manager.unmount(keyRef.current);
        };
    }, []);
    return null;
};
Portal.Host = PortalHost;
Portal.add = portal.add;
Portal.remove = portal.remove;
Portal.update = portal.update;
export default Portal;
