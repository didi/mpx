import { useEffect, useCallback, useMemo, useRef, isValidElement, useContext, useState, Children, cloneElement, createElement } from 'react';
import { Image } from 'react-native';
import { isObject, isFunction, isNumber, hasOwn, diffAndCloneA, error, warn } from '@mpxjs/utils';
import { VarContext, ScrollViewContext, RouteContext } from './context';
import { ExpressionParser, parseFunc, ReplaceSource } from './parser';
import { initialWindowMetrics } from 'react-native-safe-area-context';
import FastImage from '@d11/react-native-fast-image';
import { Gesture } from 'react-native-gesture-handler';
export const TEXT_STYLE_REGEX = /color|font.*|text.*|letterSpacing|lineHeight|includeFontPadding|writingDirection/;
export const PERCENT_REGEX = /^\s*-?\d+(\.\d+)?%\s*$/;
export const URL_REGEX = /^\s*url\(["']?(.*?)["']?\)\s*$/;
export const SVG_REGEXP = /https?:\/\/.*\.(?:svg)/i;
export const BACKGROUND_REGEX = /^background(Image|Size|Repeat|Position)$/;
export const TEXT_PROPS_REGEX = /ellipsizeMode|numberOfLines|allowFontScaling/;
export const DEFAULT_FONT_SIZE = 16;
export const HIDDEN_STYLE = {
    opacity: 0
};
export const isIOS = __mpx_mode__ === 'ios';
export const isAndroid = __mpx_mode__ === 'android';
export const isHarmony = __mpx_mode__ === 'harmony';
const varDecRegExp = /^--/;
const varUseRegExp = /var\(/;
const unoVarDecRegExp = /^--un-/;
const unoVarUseRegExp = /var\(--un-/;
const calcUseRegExp = /calc\(/;
const envUseRegExp = /env\(/;
const filterRegExp = /(calc|env|%)/;
const safeAreaInsetMap = {
    'safe-area-inset-top': 'top',
    'safe-area-inset-right': 'right',
    'safe-area-inset-bottom': 'bottom',
    'safe-area-inset-left': 'left'
};
function getSafeAreaInset(name, navigation) {
    const insets = extendObject({}, initialWindowMetrics?.insets, navigation?.insets);
    return insets[safeAreaInsetMap[name]];
}
export function useNavigation() {
    const { navigation } = useContext(RouteContext) || {};
    return navigation;
}
export function omit(obj, fields) {
    const shallowCopy = extendObject({}, obj);
    for (let i = 0; i < fields.length; i += 1) {
        const key = fields[i];
        delete shallowCopy[key];
    }
    return shallowCopy;
}
/**
 * 用法等同于 useEffect，但是会忽略首次执行，只在依赖更新时执行
 */
export const useUpdateEffect = (effect, deps) => {
    const isMounted = useRef(false);
    // for react-refresh
    useEffect(() => {
        return () => {
            isMounted.current = false;
        };
    }, []);
    useEffect(() => {
        if (!isMounted.current) {
            isMounted.current = true;
        }
        else {
            return effect();
        }
    }, deps);
};
export const parseUrl = (cssUrl = '') => {
    if (!cssUrl)
        return;
    const match = cssUrl.match(URL_REGEX);
    return match?.[1];
};
export const getRestProps = (transferProps = {}, originProps = {}, deletePropsKey = []) => {
    return extendObject({}, transferProps, omit(originProps, deletePropsKey));
};
export function isText(ele) {
    if (isValidElement(ele)) {
        const displayName = ele.type?.displayName;
        const isCustomText = ele.type?.isCustomText;
        return displayName === 'MpxText' || displayName === 'MpxSimpleText' || displayName === 'MpxInlineText' || displayName === 'Text' || !!isCustomText;
    }
    return false;
}
export function every(children, callback) {
    const childrenArray = Array.isArray(children) ? children : [children];
    return childrenArray.every((child) => callback(child));
}
export function groupBy(obj, callback, group = {}) {
    Object.entries(obj).forEach(([key, val]) => {
        const groupKey = callback(key, val);
        group[groupKey] = group[groupKey] || {};
        group[groupKey][key] = val;
    });
    return group;
}
export function splitStyle(styleObj) {
    return groupBy(styleObj, (key) => {
        if (TEXT_STYLE_REGEX.test(key)) {
            return 'textStyle';
        }
        else if (BACKGROUND_REGEX.test(key)) {
            return 'backgroundStyle';
        }
        else {
            return 'innerStyle';
        }
    });
}
const selfPercentRule = {
    translateX: 'width',
    translateY: 'height',
    borderTopLeftRadius: 'width',
    borderBottomLeftRadius: 'width',
    borderBottomRightRadius: 'width',
    borderTopRightRadius: 'width',
    borderRadius: 'width'
};
const parentHeightPercentRule = {
    height: true,
    minHeight: true,
    maxHeight: true,
    top: true,
    bottom: true
};
function resolvePercent(value, key, percentConfig) {
    if (!(typeof value === 'string' && PERCENT_REGEX.test(value)))
        return value;
    let base;
    let reason;
    if (key === 'fontSize') {
        base = percentConfig.parentFontSize;
        reason = 'parent-font-size';
    }
    else if (key === 'lineHeight') {
        base = resolvePercent(percentConfig.fontSize, 'fontSize', percentConfig);
        reason = 'font-size';
    }
    else if (selfPercentRule[key]) {
        base = percentConfig[selfPercentRule[key]];
        reason = selfPercentRule[key];
    }
    else if (parentHeightPercentRule[key]) {
        base = percentConfig.parentHeight;
        reason = 'parent-height';
    }
    else {
        base = percentConfig.parentWidth;
        reason = 'parent-width';
    }
    if (typeof base !== 'number') {
        error(`[${key}] can not contain % unit unless you set [${reason}] with a number for the percent calculation.`);
        return value;
    }
    else {
        return parseFloat(value) / 100 * base;
    }
}
function transformPercent(styleObj, percentKeyPaths, percentConfig) {
    percentKeyPaths.forEach((percentKeyPath) => {
        setStyle(styleObj, percentKeyPath, ({ target, key, value }) => {
            target[key] = resolvePercent(value, key, percentConfig);
        });
    });
}
function resolveVar(input, varContext) {
    const parsed = parseFunc(input, 'var');
    const replaced = new ReplaceSource(input);
    parsed.forEach(({ start, end, args }) => {
        const varName = args[0];
        const fallback = args[1] || '';
        let varValue = hasOwn(varContext, varName) ? varContext[varName] : fallback;
        if (varUseRegExp.test(varValue)) {
            varValue = '' + resolveVar(varValue, varContext);
        }
        else {
            varValue = '' + global.__formatValue(varValue);
        }
        replaced.replace(start, end - 1, varValue);
    });
    return global.__formatValue(replaced.source());
}
function transformVar(styleObj, varKeyPaths, varContext, visitOther) {
    varKeyPaths.forEach((varKeyPath) => {
        setStyle(styleObj, varKeyPath, ({ target, key, value }) => {
            target[key] = resolveVar(value, varContext);
            visitOther({ target, key, value: target[key], keyPath: varKeyPath });
        });
    });
}
function transformEnv(styleObj, envKeyPaths, navigation) {
    envKeyPaths.forEach((envKeyPath) => {
        setStyle(styleObj, envKeyPath, ({ target, key, value }) => {
            const parsed = parseFunc(value, 'env');
            const replaced = new ReplaceSource(value);
            parsed.forEach(({ start, end, args }) => {
                const name = args[0];
                const fallback = args[1] || '';
                const value = '' + (getSafeAreaInset(name, navigation) ?? global.__formatValue(fallback));
                replaced.replace(start, end - 1, value);
            });
            target[key] = global.__formatValue(replaced.source());
        });
    });
}
function transformCalc(styleObj, calcKeyPaths, formatter) {
    calcKeyPaths.forEach((calcKeyPath) => {
        setStyle(styleObj, calcKeyPath, ({ target, key, value }) => {
            const parsed = parseFunc(value, 'calc');
            const replaced = new ReplaceSource(value);
            parsed.forEach(({ start, end, args }) => {
                const exp = args[0];
                try {
                    const result = new ExpressionParser(exp, (value) => {
                        return formatter(value, key);
                    }).parse();
                    replaced.replace(start, end - 1, '' + result.value);
                }
                catch (e) {
                    error(`calc(${exp}) parse error.`, undefined, e);
                }
            });
            target[key] = global.__formatValue(replaced.source());
        });
    });
}
function transformStringify(styleObj) {
    if (isNumber(styleObj.fontWeight)) {
        styleObj.fontWeight = '' + styleObj.fontWeight;
    }
}
function transformPosition(styleObj, meta) {
    if (styleObj.position === 'fixed') {
        styleObj.position = 'absolute';
        meta.hasPositionFixed = true;
    }
}
// 多value解析
function parseValues(str, char = ' ') {
    let stack = 0;
    let temp = '';
    const result = [];
    for (let i = 0; i < str.length; i++) {
        if (str[i] === '(') {
            stack++;
        }
        else if (str[i] === ')') {
            stack--;
        }
        // 非括号内 或者 非分隔字符且非空
        if (stack !== 0 || (str[i] !== char && str[i] !== ' ')) {
            temp += str[i];
        }
        if ((stack === 0 && str[i] === char) || i === str.length - 1) {
            result.push(temp);
            temp = '';
        }
    }
    return result;
}
// parse string transform, eg: transform: 'rotateX(45deg) rotateZ(0.785398rad)'
function parseTransform(transformStr) {
    const values = parseValues(transformStr);
    const transform = [];
    values.forEach(item => {
        const match = item.match(/([/\w]+)\((.+)\)/);
        if (match && match.length >= 3) {
            let key = match[1];
            const val = match[2];
            switch (key) {
                case 'translateX':
                case 'translateY':
                case 'scaleX':
                case 'scaleY':
                case 'rotateX':
                case 'rotateY':
                case 'rotateZ':
                case 'rotate':
                case 'skewX':
                case 'skewY':
                case 'perspective':
                    // rotate 处理成 rotateZ
                    key = key === 'rotate' ? 'rotateZ' : key;
                    // 单个值处理
                    transform.push({ [key]: global.__formatValue(val) });
                    break;
                case 'matrix':
                    transform.push({ [key]: parseValues(val, ',').map(val => +val) });
                    break;
                case 'translate':
                case 'scale':
                case 'skew':
                case 'translate3d': // x y 支持 z不支持
                case 'scale3d': // x y 支持 z不支持
                    {
                        // 2 个以上的值处理
                        key = key.replace('3d', '');
                        const vals = parseValues(val, ',').splice(0, 3);
                        // scale(.5) === scaleX(.5) scaleY(.5)
                        if (vals.length === 1 && key === 'scale') {
                            vals.push(vals[0]);
                        }
                        const xyz = ['X', 'Y', 'Z'];
                        transform.push(...vals.map((v, index) => {
                            return { [`${key}${xyz[index] || ''}`]: global.__formatValue(v.trim()) };
                        }));
                        break;
                    }
            }
        }
    });
    return transform;
}
// format style transform
function transformTransform(style) {
    if (!style.transform || Array.isArray(style.transform))
        return;
    style.transform = parseTransform(style.transform);
}
function transformBoxShadow(styleObj) {
    if (!styleObj.boxShadow)
        return;
    styleObj.boxShadow = parseValues(styleObj.boxShadow).reduce((res, i, idx) => {
        return `${res}${idx === 0 ? '' : ' '}${global.__formatValue(i)}`;
    }, '');
}
export function useTransformStyle(styleObj = {}, { enableVar, externalVarContext, parentFontSize, parentWidth, parentHeight }) {
    const varStyle = {};
    const unoVarStyle = {};
    const normalStyle = {};
    let hasVarDec = false;
    let hasVarUse = false;
    let hasSelfPercent = false;
    const varKeyPaths = [];
    const unoVarKeyPaths = [];
    const percentKeyPaths = [];
    const calcKeyPaths = [];
    const envKeyPaths = [];
    const [width, setWidth] = useState(0);
    const [height, setHeight] = useState(0);
    const navigation = useNavigation();
    function varVisitor({ target, key, value, keyPath }) {
        if (keyPath.length === 1) {
            if (unoVarDecRegExp.test(key)) {
                unoVarStyle[key] = value;
            }
            else if (varDecRegExp.test(key)) {
                hasVarDec = true;
                varStyle[key] = value;
            }
            else {
                // clone对象避免set值时改写到props
                normalStyle[key] = isObject(value) ? diffAndCloneA(value).clone : value;
            }
        }
        // 对于var定义中使用的var无需替换值，可以通过resolveVar递归解析出值
        if (!varDecRegExp.test(key)) {
            // 一般情况下一个样式属性中不会混用unocss var和普通css var，可分开进行互斥处理
            if (unoVarUseRegExp.test(value)) {
                unoVarKeyPaths.push(keyPath.slice());
            }
            else if (varUseRegExp.test(value)) {
                hasVarUse = true;
                varKeyPaths.push(keyPath.slice());
            }
            else {
                visitOther({ target, key, value, keyPath });
            }
        }
    }
    function envVisitor({ value, keyPath }) {
        if (envUseRegExp.test(value)) {
            envKeyPaths.push(keyPath.slice());
        }
    }
    function calcVisitor({ value, keyPath }) {
        if (calcUseRegExp.test(value)) {
            calcKeyPaths.push(keyPath.slice());
        }
    }
    function percentVisitor({ key, value, keyPath }) {
        if (hasOwn(selfPercentRule, key) && PERCENT_REGEX.test(value)) {
            hasSelfPercent = true;
            percentKeyPaths.push(keyPath.slice());
        }
        else if ((key === 'fontSize' || key === 'lineHeight') && PERCENT_REGEX.test(value)) {
            percentKeyPaths.push(keyPath.slice());
        }
    }
    function visitOther({ target, key, value, keyPath }) {
        if (filterRegExp.test(value)) {
            [envVisitor, percentVisitor, calcVisitor].forEach(visitor => visitor({ target, key, value, keyPath }));
        }
    }
    // traverse var & generate normalStyle
    traverseStyle(styleObj, [varVisitor]);
    hasVarDec = hasVarDec || !!externalVarContext;
    enableVar = enableVar || hasVarDec || hasVarUse;
    const enableVarRef = useRef(enableVar);
    if (enableVarRef.current !== enableVar) {
        error('css variable use/declare should be stable in the component lifecycle, or you can set [enable-var] with true.');
    }
    // apply css var
    const varContextRef = useRef({});
    if (enableVarRef.current) {
        // eslint-disable-next-line react-hooks/rules-of-hooks
        const varContext = useContext(VarContext);
        const newVarContext = extendObject({}, varContext, externalVarContext, varStyle);
        // 缓存比较newVarContext是否发生变化
        if (diffAndCloneA(varContextRef.current, newVarContext).diff) {
            varContextRef.current = newVarContext;
        }
        transformVar(normalStyle, varKeyPaths, varContextRef.current, visitOther);
    }
    // apply unocss var
    if (unoVarKeyPaths.length) {
        transformVar(normalStyle, unoVarKeyPaths, unoVarStyle, visitOther);
    }
    const percentConfig = {
        width,
        height,
        fontSize: normalStyle.fontSize,
        parentWidth,
        parentHeight,
        parentFontSize
    };
    const positionMeta = {
        hasPositionFixed: false
    };
    // apply env
    transformEnv(normalStyle, envKeyPaths, navigation);
    // apply percent
    transformPercent(normalStyle, percentKeyPaths, percentConfig);
    // apply calc
    transformCalc(normalStyle, calcKeyPaths, (value, key) => {
        if (PERCENT_REGEX.test(value)) {
            const resolved = resolvePercent(value, key, percentConfig);
            return typeof resolved === 'number' ? resolved : 0;
        }
        else {
            const formatted = global.__formatValue(value);
            if (typeof formatted === 'number') {
                return formatted;
            }
            else {
                warn('calc() only support number, px, rpx, % temporarily.');
                return 0;
            }
        }
    });
    // apply position
    transformPosition(normalStyle, positionMeta);
    // transform number enum stringify
    transformStringify(normalStyle);
    // transform rpx to px
    transformBoxShadow(normalStyle);
    // transform 字符串格式转化数组格式
    transformTransform(normalStyle);
    return {
        hasVarDec,
        varContextRef,
        setWidth,
        setHeight,
        normalStyle,
        hasSelfPercent,
        hasPositionFixed: positionMeta.hasPositionFixed
    };
}
export function traverseStyle(styleObj, visitors) {
    const keyPath = [];
    function traverse(target) {
        if (Array.isArray(target)) {
            target.forEach((value, index) => {
                const key = String(index);
                keyPath.push(key);
                visitors.forEach(visitor => visitor({ target, key, value, keyPath }));
                traverse(value);
                keyPath.pop();
            });
        }
        else if (isObject(target)) {
            Object.entries(target).forEach(([key, value]) => {
                keyPath.push(key);
                visitors.forEach(visitor => visitor({ target, key, value, keyPath }));
                traverse(value);
                keyPath.pop();
            });
        }
    }
    traverse(styleObj);
}
export function setStyle(styleObj, keyPath, setter) {
    let target = styleObj;
    const lastKey = keyPath[keyPath.length - 1];
    for (let i = 0; i < keyPath.length - 1; i++) {
        target = target[keyPath[i]];
        if (!target)
            return;
    }
    setter({
        target,
        key: lastKey,
        value: target[lastKey],
        keyPath
    });
}
export function splitProps(props) {
    return groupBy(props, (key) => {
        if (TEXT_PROPS_REGEX.test(key)) {
            return 'textProps';
        }
        else {
            return 'innerProps';
        }
    });
}
export const useLayout = ({ props, hasSelfPercent, setWidth, setHeight, onLayout, nodeRef }) => {
    const layoutRef = useRef({});
    const hasLayoutRef = useRef(false);
    const layoutStyle = useMemo(() => { return !hasLayoutRef.current && hasSelfPercent ? HIDDEN_STYLE : {}; }, [hasLayoutRef.current]);
    const layoutProps = {};
    const navigation = useNavigation();
    const enableOffset = props['enable-offset'];
    if (hasSelfPercent || onLayout || enableOffset) {
        layoutProps.onLayout = (e) => {
            hasLayoutRef.current = true;
            if (hasSelfPercent) {
                const { width, height } = e?.nativeEvent?.layout || {};
                setWidth && setWidth(width || 0);
                setHeight && setHeight(height || 0);
            }
            if (enableOffset) {
                nodeRef.current?.measure((x, y, width, height, offsetLeft, offsetTop) => {
                    const { top: navigationY = 0 } = navigation?.layout || {};
                    layoutRef.current = { x, y: y - navigationY, width, height, offsetLeft, offsetTop: offsetTop - navigationY };
                });
            }
            onLayout && onLayout(e);
            props.onLayout && props.onLayout(e);
        };
    }
    return {
        layoutRef,
        layoutStyle,
        layoutProps
    };
};
export function wrapChildren(props = {}, { hasVarDec, varContext, textStyle, textProps }) {
    let { children } = props;
    if (textStyle || textProps) {
        children = Children.map(children, (child) => {
            if (isText(child)) {
                const style = extendObject({}, textStyle, child.props.style);
                return cloneElement(child, extendObject({}, textProps, { style }));
            }
            return child;
        });
    }
    if (hasVarDec && varContext) {
        children = <VarContext.Provider value={varContext} key='varContextWrap'>{children}</VarContext.Provider>;
    }
    return children;
}
export const debounce = (func, delay) => {
    let timer;
    const wrapper = (...args) => {
        timer && clearTimeout(timer);
        timer = setTimeout(() => {
            func(...args);
        }, delay);
    };
    wrapper.clear = () => {
        timer && clearTimeout(timer);
        timer = null;
    };
    return wrapper;
};
export const useDebounceCallback = (func, delay) => {
    const debounced = useMemo(() => debounce(func, delay), [func]);
    return debounced;
};
export const useStableCallback = (callback) => {
    const ref = useRef(callback);
    ref.current = callback;
    return useCallback((...args) => ref.current?.(...args), []);
};
export function usePrevious(value) {
    const ref = useRef();
    const prev = ref.current;
    ref.current = value;
    return prev;
}
export function flatGesture(gestures = []) {
    return (gestures && gestures.flatMap((gesture) => {
        if (gesture && gesture.nodeRefs) {
            return gesture.nodeRefs
                .map((item) => item.getNodeInstance()?.instance?.gestureRef || {});
        }
        return gesture?.current ? [gesture] : [];
    })) || [];
}
export const extendObject = Object.assign;
export function getCurrentPage(pageId) {
    if (!global.getCurrentPages)
        return;
    const pages = global.getCurrentPages();
    return pages.find((page) => isFunction(page.getPageId) && page.getPageId() === pageId);
}
export function renderImage(imageProps, enableFastImage = false) {
    const Component = enableFastImage ? FastImage : Image;
    return createElement(Component, imageProps);
}
export function pickStyle(styleObj = {}, pickedKeys, callback) {
    return pickedKeys.reduce((acc, key) => {
        if (key in styleObj) {
            acc[key] = callback ? callback(key, styleObj[key]) : styleObj[key];
        }
        return acc;
    }, {});
}
export function useHover({ enableHover, hoverStartTime, hoverStayTime, disabled }) {
    const enableHoverRef = useRef(enableHover);
    if (enableHoverRef.current !== enableHover) {
        error('[Mpx runtime error]: hover-class use should be stable in the component lifecycle.');
    }
    if (!enableHoverRef.current)
        return { isHover: false };
    // eslint-disable-next-line react-hooks/rules-of-hooks
    const gestureRef = useContext(ScrollViewContext).gestureRef;
    // eslint-disable-next-line react-hooks/rules-of-hooks
    const [isHover, setIsHover] = useState(false);
    // eslint-disable-next-line react-hooks/rules-of-hooks
    const dataRef = useRef({});
    // eslint-disable-next-line react-hooks/rules-of-hooks
    useEffect(() => {
        return () => {
            dataRef.current.startTimer && clearTimeout(dataRef.current.startTimer);
            dataRef.current.stayTimer && clearTimeout(dataRef.current.stayTimer);
        };
    }, []);
    const setStartTimer = () => {
        if (disabled)
            return;
        dataRef.current.startTimer && clearTimeout(dataRef.current.startTimer);
        dataRef.current.startTimer = setTimeout(() => {
            setIsHover(true);
        }, +hoverStartTime);
    };
    const setStayTimer = () => {
        if (disabled)
            return;
        dataRef.current.stayTimer && clearTimeout(dataRef.current.stayTimer);
        dataRef.current.startTimer && clearTimeout(dataRef.current.startTimer);
        dataRef.current.stayTimer = setTimeout(() => {
            setIsHover(false);
        }, +hoverStayTime);
    };
    // eslint-disable-next-line react-hooks/rules-of-hooks
    const gesture = useMemo(() => {
        return Gesture.Pan()
            .onTouchesDown(() => {
            setStartTimer();
        })
            .onTouchesUp(() => {
            setStayTimer();
        }).runOnJS(true);
    }, []);
    if (gestureRef) {
        gesture.simultaneousWithExternalGesture(gestureRef);
    }
    return {
        isHover,
        gesture
    };
}
export function useRunOnJSCallback(callbackMapRef) {
    const invokeCallback = useCallback((key, ...args) => {
        const callback = callbackMapRef.current[key];
        // eslint-disable-next-line node/no-callback-literal
        if (isFunction(callback))
            return callback(...args);
    }, []);
    useEffect(() => {
        return () => {
            callbackMapRef.current = {};
        };
    }, []);
    return invokeCallback;
}
