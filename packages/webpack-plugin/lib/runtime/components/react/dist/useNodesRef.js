import { useRef, useImperativeHandle } from 'react';
export default function useNodesRef(props, ref, nodeRef, instance = {}) {
    const _props = useRef(null);
    _props.current = props;
    useImperativeHandle(ref, () => {
        return {
            getNodeInstance() {
                return {
                    props: _props,
                    nodeRef,
                    instance
                };
            }
        };
    });
}
