import { useEffect, useRef, useMemo, useContext } from 'react';
import { View, DeviceEventEmitter, NativeEventEmitter, StyleSheet } from 'react-native';
import PortalManager from './portal-manager';
import { PortalContext, RouteContext } from '../context';
// events
const addType = 'MPX_RN_ADD_PORTAL';
const removeType = 'MPX_RN_REMOVE_PORTAL';
const updateType = 'MPX_RN_UPDATE_PORTAL';
// fix react native web does not support DeviceEventEmitter
const TopViewEventEmitter = DeviceEventEmitter || new NativeEventEmitter();
const styles = StyleSheet.create({
    container: {
        flex: 1
    }
});
class PortalGuard {
    nextKey = 10000;
    add = (e, id) => {
        const key = this.nextKey++;
        TopViewEventEmitter.emit(addType, e, key, id);
        return key;
    };
    remove = (key) => {
        TopViewEventEmitter.emit(removeType, key);
    };
    update = (key, e) => {
        TopViewEventEmitter.emit(updateType, key, e);
    };
}
/**
 * portal
 */
export const portal = new PortalGuard();
const PortalHost = ({ children }) => {
    const _nextKey = useRef(0);
    const manager = useRef(null);
    const queue = useRef([]);
    const { pageId } = useContext(RouteContext) || {};
    const mount = (children, _key, id) => {
        if (id !== pageId)
            return;
        const key = _key || _nextKey.current++;
        if (manager.current) {
            manager.current.mount(key, children);
        }
        else {
            queue.current.push({ type: 'mount', key, children });
        }
        return key;
    };
    const unmount = (key) => {
        if (manager.current) {
            manager.current.unmount(key);
        }
        else {
            queue.current.push({ type: 'unmount', key, children });
        }
    };
    const update = (key, children) => {
        if (manager.current) {
            manager.current.update(key, children);
        }
        else {
            const operation = { type: 'mount', key, children };
            const index = queue.current.findIndex((q) => q.type === 'mount' && q.key === key);
            if (index > -1) {
                queue.current[index] = operation;
            }
            else {
                queue.current.push(operation);
            }
        }
    };
    const subScriptions = useMemo(() => {
        return [
            TopViewEventEmitter.addListener(addType, mount),
            TopViewEventEmitter.addListener(removeType, unmount),
            TopViewEventEmitter.addListener(updateType, update)
        ];
    }, []);
    useEffect(() => {
        while (queue.current.length && manager.current) {
            const operation = queue.current.shift();
            if (!operation)
                return;
            switch (operation.type) {
                case 'mount':
                    manager.current.mount(operation.key, operation.children);
                    break;
                case 'unmount':
                    manager.current.unmount(operation.key);
                    break;
            }
        }
        return () => {
            subScriptions.forEach((subScription) => {
                subScription.remove();
            });
        };
    }, []);
    return (<PortalContext.Provider value={{
            mount,
            update,
            unmount
        }}>
      <View style={styles.container} collapsable={false}>
        {children}
      </View>
      <PortalManager ref={manager}/>
    </PortalContext.Provider>);
};
export default PortalHost;
