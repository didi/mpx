import { useEffect, useMemo, useRef } from 'react';
import { Easing, useSharedValue, withTiming, useAnimatedStyle, withSequence, withDelay, makeMutable, cancelAnimation, runOnJS } from 'react-native-reanimated';
import { error, hasOwn, collectDataset } from '@mpxjs/utils';
import { useRunOnJSCallback } from './utils';
// 微信 timingFunction 和 RN Easing 对应关系
const EasingKey = {
    linear: Easing.linear,
    ease: Easing.inOut(Easing.ease),
    'ease-in': Easing.in(Easing.poly(3)),
    'ease-in-out': Easing.inOut(Easing.poly(3)),
    'ease-out': Easing.out(Easing.poly(3))
    // 'step-start': '',
    // 'step-end': ''
};
const TransformInitial = {
    // matrix: 0,
    // matrix3d: 0,
    // rotate: '0deg',
    rotateX: '0deg',
    rotateY: '0deg',
    rotateZ: '0deg',
    // rotate3d:[0,0,0]
    // scale: 1,
    // scale3d: [1, 1, 1],
    scaleX: 1,
    scaleY: 1,
    // scaleZ: 1,
    // skew: 0,
    skewX: '0deg',
    skewY: '0deg',
    // translate: 0,
    // translate3d: 0,
    translateX: 0,
    translateY: 0
    // translateZ: 0,
};
// 动画默认初始值
const InitialValue = Object.assign({
    opacity: 1,
    backgroundColor: 'transparent',
    width: 0,
    height: 0,
    top: 0,
    right: 0,
    bottom: 0,
    left: 0,
    transformOrigin: ['50%', '50%', 0]
}, TransformInitial);
const TransformOrigin = 'transformOrigin';
// transform
const isTransform = (key) => Object.keys(TransformInitial).includes(key);
// transform 数组转对象
function getTransformObj(transforms) {
    'worklet';
    return transforms.reduce((transformObj, item) => {
        return Object.assign(transformObj, item);
    }, {});
}
export default function useAnimationHooks(props) {
    const { style: originalStyle = {}, animation, enableAnimation, transitionend, layoutRef } = props;
    const enableStyleAnimation = enableAnimation || !!animation;
    const enableAnimationRef = useRef(enableStyleAnimation);
    if (enableAnimationRef.current !== enableStyleAnimation) {
        error('[Mpx runtime error]: animation use should be stable in the component lifecycle, or you can set [enable-animation] with true.');
    }
    if (!enableAnimationRef.current)
        return { enableStyleAnimation: false };
    // id 标识
    const id = animation?.id || -1;
    // 有动画样式的 style key
    // eslint-disable-next-line react-hooks/rules-of-hooks
    const animatedStyleKeys = useSharedValue([]);
    // 记录动画key的style样式值 没有的话设置为false
    // eslint-disable-next-line react-hooks/rules-of-hooks
    const animatedKeys = useRef({});
    // 记录上次style map
    // eslint-disable-next-line react-hooks/rules-of-hooks
    const lastStyleRef = useRef({});
    // ** 全量 style prop sharedValue
    // 不能做增量的原因：
    // 1 尝试用 useRef，但 useAnimatedStyle 访问后的 ref 不能在增加新的值，被冻结
    // 2 尝试用 useSharedValue，因为实际触发的 style prop 需要是 sharedValue 才能驱动动画，若外层 shareValMap 也是 sharedValue，动画无法驱动。
    // eslint-disable-next-line react-hooks/rules-of-hooks
    const shareValMap = useMemo(() => {
        return Object.keys(InitialValue).reduce((valMap, key) => {
            const defaultVal = getInitialVal(key, isTransform(key));
            valMap[key] = makeMutable(defaultVal);
            return valMap;
        }, {});
    }, []);
    // ** style更新同步
    // eslint-disable-next-line react-hooks/rules-of-hooks
    useEffect(() => {
        // style 更新后同步更新 lastStyleRef & shareValMap
        updateStyleVal();
    }, [originalStyle]);
    // ** 获取动画样式prop & 驱动动画
    // eslint-disable-next-line react-hooks/rules-of-hooks
    useEffect(() => {
        if (id === -1)
            return;
        // 更新动画样式 key map
        animatedKeys.current = getAnimatedStyleKeys();
        const keys = Object.keys(animatedKeys.current);
        animatedStyleKeys.value = formatAnimatedKeys([TransformOrigin, ...keys]);
        // 驱动动画
        createAnimation(keys);
    }, [id]);
    // ** 清空动画
    // eslint-disable-next-line react-hooks/rules-of-hooks
    useEffect(() => {
        return () => {
            Object.values(shareValMap).forEach((value) => {
                cancelAnimation(value);
            });
        };
    }, []);
    // 根据 animation action 创建&驱动动画
    function createAnimation(animatedKeys = []) {
        const actions = animation?.actions || [];
        const sequence = {};
        const lastValueMap = {};
        actions.forEach(({ animatedOption, rules, transform }, index) => {
            const { delay, duration, timingFunction, transformOrigin } = animatedOption;
            const easing = EasingKey[timingFunction] || Easing.inOut(Easing.quad);
            let needSetCallback = true;
            const setTransformOrigin = (finished) => {
                'worklet';
                // 动画结束后设置下一次transformOrigin
                if (finished) {
                    if (index < actions.length - 1) {
                        const transformOrigin = actions[index + 1].animatedOption?.transformOrigin;
                        transformOrigin && (shareValMap[TransformOrigin].value = transformOrigin);
                    }
                }
            };
            if (index === 0) {
                // 设置当次中心
                shareValMap[TransformOrigin].value = transformOrigin;
            }
            // 添加每个key的多次step动画
            animatedKeys.forEach(key => {
                const ruleV = isTransform(key) ? transform.get(key) : rules.get(key);
                // key不存在，第一轮取shareValMap[key]value，非第一轮取上一轮的
                const toVal = ruleV !== undefined
                    ? ruleV
                    : index > 0
                        ? lastValueMap[key]
                        : shareValMap[key].value;
                const animation = getAnimation({ key, value: toVal }, { delay, duration, easing }, needSetCallback ? setTransformOrigin : undefined);
                needSetCallback = false;
                if (!sequence[key]) {
                    sequence[key] = [animation];
                }
                else {
                    sequence[key].push(animation);
                }
                // 更新一下 lastValueMap
                lastValueMap[key] = toVal;
            });
            // 赋值驱动动画
            animatedKeys.forEach((key) => {
                const animations = sequence[key];
                shareValMap[key].value = withSequence(...animations);
            });
        });
    }
    function withTimingCallback(finished, current, duration) {
        if (!transitionend)
            return;
        const target = {
            id: animation?.id || -1,
            dataset: collectDataset(props),
            offsetLeft: layoutRef?.current?.offsetLeft || 0,
            offsetTop: layoutRef?.current?.offsetTop || 0
        };
        transitionend({
            type: 'transitionend',
            // elapsedTime 对齐wx 单位s
            detail: { elapsedTime: duration ? duration / 1000 : 0, finished, current },
            target,
            currentTarget: target,
            timeStamp: Date.now()
        });
    }
    // eslint-disable-next-line react-hooks/rules-of-hooks
    const runOnJSCallbackRef = useRef({
        withTimingCallback
    });
    // eslint-disable-next-line react-hooks/rules-of-hooks
    const runOnJSCallback = useRunOnJSCallback(runOnJSCallbackRef);
    // 创建单个animation
    function getAnimation({ key, value }, { delay, duration, easing }, callback) {
        const animation = typeof callback === 'function'
            ? withTiming(value, { duration, easing }, (finished, current) => {
                callback(finished, current);
                if (transitionend && finished) {
                    runOnJS(runOnJSCallback)('withTimingCallback', finished, current, duration);
                }
            })
            : withTiming(value, { duration, easing });
        return delay ? withDelay(delay, animation) : animation;
    }
    // 获取样式初始值（prop style or 默认值）
    function getInitialVal(key, isTransform = false) {
        if (isTransform && Array.isArray(originalStyle.transform)) {
            let initialVal = InitialValue[key];
            // 仅支持 { transform: [{rotateX: '45deg'}, {rotateZ: '0.785398rad'}] } 格式的初始样式
            originalStyle.transform.forEach(item => {
                if (item[key] !== undefined)
                    initialVal = item[key];
            });
            return initialVal;
        }
        return originalStyle[key] === undefined ? InitialValue[key] : originalStyle[key];
    }
    // 循环 animation actions 获取所有有动画的 style prop name
    function getAnimatedStyleKeys() {
        return (animation?.actions || []).reduce((keyMap, action) => {
            const { rules, transform } = action;
            const ruleArr = [...rules.keys(), ...transform.keys()];
            ruleArr.forEach(key => {
                if (!keyMap[key])
                    keyMap[key] = true;
            });
            return keyMap;
        }, animatedKeys.current);
    }
    // animated key transform 格式化
    function formatAnimatedKeys(keys) {
        const animatedKeys = [];
        const transforms = [];
        keys.forEach(key => {
            if (isTransform(key)) {
                transforms.push(key);
            }
            else {
                animatedKeys.push(key);
            }
        });
        if (transforms.length)
            animatedKeys.push(transforms);
        return animatedKeys;
    }
    // 设置 lastShareValRef & shareValMap
    function updateStyleVal() {
        Object.entries(originalStyle).forEach(([key, value]) => {
            if (key === 'transform') {
                Object.entries(getTransformObj(value)).forEach(([key, value]) => {
                    if (value !== lastStyleRef.current[key]) {
                        lastStyleRef.current[key] = value;
                        shareValMap[key].value = value;
                    }
                });
            }
            else if (hasOwn(shareValMap, key)) {
                if (value !== lastStyleRef.current[key]) {
                    lastStyleRef.current[key] = value;
                    shareValMap[key].value = value;
                }
            }
        });
    }
    // ** 生成动画样式
    // eslint-disable-next-line react-hooks/rules-of-hooks
    const animationStyle = useAnimatedStyle(() => {
        // console.info(`useAnimatedStyle styles=`, originalStyle)
        return animatedStyleKeys.value.reduce((styles, key) => {
            // console.info('getAnimationStyles', key, shareValMap[key].value)
            if (Array.isArray(key)) {
                const transformStyle = getTransformObj(originalStyle.transform || []);
                key.forEach((transformKey) => {
                    transformStyle[transformKey] = shareValMap[transformKey].value;
                });
                styles.transform = Object.entries(transformStyle).map(([key, value]) => {
                    return { [key]: value };
                });
            }
            else {
                styles[key] = shareValMap[key].value;
            }
            return styles;
        }, {});
    });
    return {
        enableStyleAnimation: enableAnimationRef.current,
        animationStyle
    };
}
