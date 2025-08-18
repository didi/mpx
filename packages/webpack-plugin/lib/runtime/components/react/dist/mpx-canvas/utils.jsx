import { useEffect, useRef } from 'react';
export const WEBVIEW_TARGET = '@@WEBVIEW_TARGET';
export const constructors = {};
export const ID = () => Math.random().toString(32).slice(2);
const SPECIAL_CONSTRUCTOR = {
    ImageData: {
        className: 'Uint8ClampedArray',
        paramNum: 0
    }
};
export const registerWebviewTarget = (instance, targetName) => {
    instance[WEBVIEW_TARGET] = targetName;
};
export const registerWebviewProperties = (instance, properties) => {
    Object.entries(properties).forEach(([key, initialValue]) => {
        const privateKey = `__${key}__`;
        instance[privateKey] = initialValue;
        Object.defineProperty(instance, key, {
            configurable: true,
            enumerable: true,
            get() {
                return instance[privateKey];
            },
            set(value) {
                instance.postMessage({
                    type: 'set',
                    payload: {
                        target: instance[WEBVIEW_TARGET],
                        key,
                        value
                    }
                });
                if (instance.forceUpdate) {
                    instance.forceUpdate();
                }
                return (instance[privateKey] = value);
            }
        });
    });
};
export const registerWebviewMethods = (instance, methods) => {
    methods.forEach(method => {
        instance[method] = (...args) => {
            return instance.postMessage({
                type: 'exec',
                payload: {
                    target: instance[WEBVIEW_TARGET],
                    method,
                    args
                }
            });
        };
    });
};
export const registerWebviewConstructor = (constructor, constructorName) => {
    constructors[constructorName] = constructor;
    constructor.constructLocally = function (...args) {
        return new constructor(...args, true);
    };
    constructor.prototype.onConstruction = function (...args) {
        if (SPECIAL_CONSTRUCTOR[constructorName] !== undefined) {
            const { className, paramNum } = SPECIAL_CONSTRUCTOR[constructorName];
            args[paramNum] = { className, classArgs: [args[paramNum]] };
        }
        this[WEBVIEW_TARGET] = ID();
        this.postMessage({
            type: 'construct',
            payload: {
                constructor: constructorName,
                id: this[WEBVIEW_TARGET],
                args
            }
        });
    };
    constructor.prototype.toJSON = function () {
        return { __ref__: this[WEBVIEW_TARGET] };
    };
};
export const useWebviewBinding = ({ targetName, properties = {}, methods = [] }) => {
    const instanceRef = useRef({});
    useEffect(() => {
        if (instanceRef.current) {
            registerWebviewTarget(instanceRef.current, targetName);
            registerWebviewProperties(instanceRef.current, properties);
            registerWebviewMethods(instanceRef.current, methods);
        }
    }, []);
    return instanceRef;
};
