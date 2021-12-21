'use strict';

Object.defineProperty(exports, '__esModule', { value: true });

function isString(o) {
    return typeof o === 'string';
}
function isUndefined(o) {
    return typeof o === 'undefined';
}
function isNull(o) {
    return o === null;
}
function isObject(o) {
    return o !== null && typeof o === 'object';
}
function isBoolean(o) {
    return o === true || o === false;
}
function isFunction(o) {
    return typeof o === 'function';
}
function isNumber(o) {
    return typeof o === 'number';
}
function isBooleanStringLiteral(o) {
    return o === 'true' || o === 'false';
}
const isArray = Array.isArray;

// 字符串简写
exports.Shortcuts = void 0;
(function (Shortcuts) {
    Shortcuts["Container"] = "container";
    Shortcuts["Childnodes"] = "cn";
    Shortcuts["Children"] = "children";
    Shortcuts["Text"] = "v";
    Shortcuts["TextNew"] = "content";
    Shortcuts["NodeType"] = "nt";
    Shortcuts["NodeName"] = "nn";
    Shortcuts["NodeTypeNew"] = "nodeType";
    // Attrtibutes
    Shortcuts["Style"] = "st";
    Shortcuts["StyleNew"] = "data.style";
    Shortcuts["Class"] = "cl";
    Shortcuts["ClassNew"] = "data.class";
    Shortcuts["Src"] = "src";
})(exports.Shortcuts || (exports.Shortcuts = {}));

const styles = {
    style: `i.${"data.style" /* StyleNew */}`,
    class: `i.${"data.class" /* ClassNew */}`
};
const events = {
// bindtap: '__invoke'
};
const touchEvents = {
    bindTouchStart: '',
    bindTouchMove: '',
    bindTouchEnd: '',
    bindTouchCancel: '',
    bindLongTap: ''
};
const animationEvents = {
    bindAnimationStart: '',
    bindAnimationIteration: '',
    bindAnimationEnd: '',
    bindTransitionEnd: ''
};
function singleQuote(s) {
    return `'${s}'`;
}
const View = Object.assign(Object.assign({ 'hover-class': singleQuote('none'), 'hover-stop-propagation': 'false', 'hover-start-time': '50', 'hover-stay-time': '400', animation: '' }, touchEvents), animationEvents);
const Icon = {
    type: '',
    size: '23',
    color: ''
};
const MapComp = Object.assign({ longitude: '', latitude: '', scale: '16', markers: '[]', covers: '', polyline: '[]', circles: '[]', controls: '[]', 'include-points': '[]', 'show-location': '', 'layer-style': '1', bindMarkerTap: '', bindControlTap: '', bindCalloutTap: '', bindUpdated: '' }, touchEvents);
const Progress = {
    percent: '',
    'stroke-width': '6',
    color: singleQuote('#09BB07'),
    activeColor: singleQuote('#09BB07'),
    backgroundColor: singleQuote('#EBEBEB'),
    active: 'false',
    'active-mode': singleQuote('backwards'),
    'show-info': 'false'
};
const RichText = {
    nodes: '[]'
};
const Text = {
    selectable: 'false',
    space: '',
    decode: 'false'
};
const Button = {
    size: singleQuote('default'),
    type: '',
    plain: 'false',
    disabled: '',
    loading: 'false',
    'form-type': '',
    'open-type': '',
    'hover-class': singleQuote('button-hover'),
    'hover-stop-propagation': 'false',
    'hover-start-time': '20',
    'hover-stay-time': '70',
    name: ''
};
const Checkbox = {
    value: '',
    disabled: '',
    checked: 'false',
    color: singleQuote('#09BB07'),
    name: ''
};
const CheckboxGroup = {
    bindChange: '',
    name: ''
};
const Form = {
    'report-submit': 'false',
    bindSubmit: '',
    bindReset: '',
    name: ''
};
const Input = {
    value: '',
    type: singleQuote(''),
    password: 'false',
    placeholder: '',
    'placeholder-style': '',
    'placeholder-class': singleQuote('input-placeholder'),
    disabled: '',
    maxlength: '140',
    'cursor-spacing': '0',
    focus: 'false',
    'confirm-type': singleQuote('done'),
    'confirm-hold': 'false',
    cursor: 'i.value.length',
    'selection-start': '-1',
    'selection-end': '-1',
    bindInput: '',
    bindFocus: '',
    bindBlur: '',
    bindConfirm: '',
    name: ''
};
const Label = {
    for: '',
    name: ''
};
const Picker = {
    mode: singleQuote('selector'),
    disabled: '',
    range: '',
    'range-key': '',
    value: '',
    start: '',
    end: '',
    fields: singleQuote('day'),
    'custom-item': '',
    name: '',
    bindCancel: '',
    bindChange: '',
    bindColumnChange: ''
};
const PickerView = {
    value: '',
    'indicator-style': '',
    'indicator-class': '',
    'mask-style': '',
    'mask-class': '',
    bindChange: '',
    name: ''
};
const PickerViewColumn = {
    name: ''
};
const Radio = {
    value: '',
    checked: 'false',
    disabled: '',
    color: singleQuote('#09BB07'),
    name: ''
};
const RadioGroup = {
    bindChange: '',
    name: ''
};
const Slider = {
    min: '0',
    max: '100',
    step: '1',
    disabled: '',
    value: '0',
    activeColor: singleQuote('#1aad19'),
    backgroundColor: singleQuote('#e9e9e9'),
    'block-size': '28',
    'block-color': singleQuote('#ffffff'),
    'show-value': 'false',
    bindChange: '',
    bindChanging: '',
    name: ''
};
const Switch = {
    checked: 'false',
    disabled: '',
    type: singleQuote('switch'),
    color: singleQuote('#04BE02'),
    bindChange: '',
    name: ''
};
const Textarea = {
    value: '',
    placeholder: '',
    'placeholder-style': '',
    'placeholder-class': singleQuote('textarea-placeholder'),
    disabled: '',
    maxlength: '140',
    'auto-focus': 'false',
    focus: 'false',
    'auto-height': 'false',
    fixed: 'false',
    'cursor-spacing': '0',
    cursor: '-1',
    'selection-start': '-1',
    'selection-end': '-1',
    bindFocus: '',
    bindBlur: '',
    bindLineChange: '',
    bindInput: '',
    bindConfirm: '',
    name: ''
};
const CoverImage = {
    src: '',
    bindLoad: '__invoke',
    bindError: '__invoke'
};
const CoverView = Object.assign({ 'scroll-top': 'false' }, touchEvents);
const MovableArea = {
    'scale-area': 'false'
};
const MovableView = Object.assign(Object.assign({ direction: 'none', inertia: 'false', 'out-of-bounds': 'false', x: '', y: '', damping: '20', friction: '2', disabled: '', scale: 'false', 'scale-min': '0.5', 'scale-max': '10', 'scale-value': '1', animation: 'true', bindChange: '', bindScale: '', bindHTouchMove: '', bindVTouchMove: '', width: singleQuote('10px'), height: singleQuote('10px') }, touchEvents), animationEvents);
const ScrollView = Object.assign(Object.assign({ 'scroll-x': 'false', 'scroll-y': 'false', 'upper-threshold': '50', 'lower-threshold': '50', 'scroll-top': '', 'scroll-left': '', 'scroll-into-view': '', 'scroll-with-animation': 'false', 'enable-back-to-top': 'false', bindScrollToUpper: '', bindScrollToLower: '', bindScroll: '' }, touchEvents), animationEvents);
const Swiper = Object.assign({ 'indicator-dots': 'false', 'indicator-color': singleQuote('rgba(0, 0, 0, .3)'), 'indicator-active-color': singleQuote('#000000'), autoplay: 'false', current: '0', interval: '5000', duration: '500', circular: 'false', vertical: 'false', 'previous-margin': '\'0px\'', 'next-margin': '\'0px\'', 'display-multiple-items': '1', bindChange: '', bindTransition: '', bindAnimationFinish: '' }, touchEvents);
const SwiperItem = {
    'item-id': ''
};
const Navigator = {
    url: '',
    'open-type': singleQuote('navigate'),
    delta: '1',
    'hover-class': singleQuote('navigator-hover'),
    'hover-stop-propagation': 'false',
    'hover-start-time': '50',
    'hover-stay-time': '600',
    bindSuccess: '',
    bindFail: '',
    bindComplete: ''
};
const Audio = {
    id: '',
    src: '',
    loop: 'false',
    controls: 'false',
    poster: '',
    name: '',
    author: '',
    bindError: '',
    bindPlay: '',
    bindPause: '',
    bindTimeUpdate: '',
    bindEnded: ''
};
const Camera = {
    'device-position': singleQuote('back'),
    flash: singleQuote('auto'),
    bindStop: '',
    bindError: ''
};
const Image = Object.assign({ src: '', mode: singleQuote('scaleToFill'), 'lazy-load': 'false', bindError: '', bindLoad: '' }, touchEvents);
const LivePlayer = {
    src: '',
    autoplay: 'false',
    muted: 'false',
    orientation: singleQuote('vertical'),
    'object-fit': singleQuote('contain'),
    'background-mute': 'false',
    'min-cache': '1',
    'max-cache': '3',
    animation: '',
    bindStateChange: '',
    bindFullScreenChange: '',
    bindNetStatus: ''
};
const Video = {
    src: '',
    duration: '',
    controls: 'true',
    'danmu-list': '',
    'danmu-btn': '',
    'enable-danmu': '',
    autoplay: 'false',
    loop: 'false',
    muted: 'false',
    'initial-time': '0',
    'page-gesture': 'false',
    direction: '',
    'show-progress': 'true',
    'show-fullscreen-btn': 'true',
    'show-play-btn': 'true',
    'show-center-play-btn': 'true',
    'enable-progress-gesture': 'true',
    'object-fit': singleQuote('contain'),
    poster: '',
    'show-mute-btn': 'false',
    animation: '',
    bindPlay: '',
    bindPause: '',
    bindEnded: '',
    bindTimeUpdate: '',
    bindFullScreenChange: '',
    bindWaiting: '',
    bindError: ''
};
const Canvas = Object.assign({ 'canvas-id': '', 'disable-scroll': 'false', bindError: '' }, touchEvents);
const Ad = {
    'unit-id': '',
    'ad-intervals': '',
    bindLoad: '',
    bindError: '',
    bindClose: ''
};
const WebView = {
    src: '',
    bindMessage: '',
    bindLoad: '',
    bindError: ''
};
const Block = {};
// Vue 当中使用 <slot-view></slot-view> 标签
// For Vue，因为 slot 标签被 vue 占用了
/**
 * <slot-view :name='"title"'>
 *  <view>Hello world</view>
 * </slot-view>
 */
const SlotView = {
    name: ''
};
// React 中使用 <slot></slot> 标签
// For React
// Slot 和 SlotView 最终都会编译成 <view slot={{ i.name }} />
// 因为 <slot name="{{ i.name }}" /> 适用性没有前者高（无法添加类和样式）
// 不给 View 直接加 slot 属性的原因是性能损耗
const Slot = {
    name: ''
};
const internalComponents = {
    View,
    Icon,
    Progress,
    RichText,
    Text,
    Button,
    Checkbox,
    CheckboxGroup,
    Form,
    Input,
    Label,
    Picker,
    PickerView,
    PickerViewColumn,
    Radio,
    RadioGroup,
    Slider,
    Switch,
    CoverImage,
    Textarea,
    CoverView,
    MovableArea,
    MovableView,
    ScrollView,
    Swiper,
    SwiperItem,
    Navigator,
    Audio,
    Camera,
    Image,
    LivePlayer,
    Video,
    Canvas,
    Ad,
    WebView,
    Block,
    Map: MapComp,
    Slot,
    SlotView
};
const controlledComponent = new Set([
    'input',
    'checkbox',
    'picker',
    'picker-view',
    'radio',
    'slider',
    'switch',
    'textarea'
]);
const focusComponents = new Set([
    'input',
    'textarea'
]);
// 没有子元素的节点
const voidElements = new Set([
    'progress',
    'icon',
    'rich-text',
    'input',
    'textarea',
    'slider',
    'switch',
    'audio',
    'ad',
    'official-account',
    'open-data',
    'navigation-bar'
]);
const nestElements = new Map([
    // 可自嵌套的组件
    ['view', -1],
    ['catch-view', -1],
    ['cover-view', -1],
    ['static-view', -1],
    ['pure-view', -1],
    ['block', -1],
    ['text', -1],
    // 可自嵌套组件的最多的层级
    ['static-text', 6],
    ['slot', 8],
    ['slot-view', 8],
    ['label', 6],
    ['form', 4],
    ['scroll-view', 4],
    ['swiper', 4],
    ['swiper-item', 4]
]);

const EMPTY_OBJ = {};
const EMPTY_ARR = [];
const noop = (..._) => { };
const defaultReconciler = Object.create(null);
/**
 * box creates a boxed value.
 *
 * @typeparam T Value type.
 * @param v Value.
 * @returns Boxed value.
 */
const box = (v) => ({ v });
/**
 * box creates a boxed value.
 *
 * @typeparam T Value type.
 * @param b Boxed value.
 * @returns Value.
 */
const unbox = (b) => b.v;
function toDashed(s) {
    return s.replace(/([a-z0-9])([A-Z])/g, '$1-$2').toLowerCase();
}
function toCamelCase(s) {
    let camel = '';
    let nextCap = false;
    for (let i = 0; i < s.length; i++) {
        if (s[i] !== '-') {
            camel += nextCap ? s[i].toUpperCase() : s[i];
            nextCap = false;
        }
        else {
            nextCap = true;
        }
    }
    return camel;
}
const toKebabCase = function (string) {
    return string.replace(/([a-z])([A-Z])/g, '$1-$2').toLowerCase();
};
function capitalize(s) {
    return s.charAt(0).toUpperCase() + s.slice(1);
}
const hasOwnProperty = Object.prototype.hasOwnProperty;
const hasOwn = (val, key) => hasOwnProperty.call(val, key);
function warn(condition, msg) {
    if (process.env.NODE_ENV !== 'production') {
        if (condition) {
            console.warn(`[mpx warn] ${msg}`);
        }
    }
}
function queryToJson(str) {
    const dec = decodeURIComponent;
    const qp = str.split('&');
    const ret = {};
    let name;
    let val;
    for (let i = 0, l = qp.length, item; i < l; ++i) {
        item = qp[i];
        if (item.length) {
            const s = item.indexOf('=');
            if (s < 0) {
                name = dec(item);
                val = '';
            }
            else {
                name = dec(item.slice(0, s));
                val = dec(item.slice(s + 1));
            }
            if (typeof ret[name] === 'string') { // inline'd type check
                ret[name] = [ret[name]];
            }
            if (Array.isArray(ret[name])) {
                ret[name].push(val);
            }
            else {
                ret[name] = val;
            }
        }
    }
    return ret; // Object
}
let _uniqueId = 1;
const _loadTime = (new Date()).getTime().toString();
function getUniqueKey() {
    return _loadTime + (_uniqueId++);
}
const cacheData = {};
function cacheDataSet(key, val) {
    cacheData[key] = val;
}
function cacheDataGet(key, delelteAfterGet) {
    const temp = cacheData[key];
    delelteAfterGet && delete cacheData[key];
    return temp;
}
function cacheDataHas(key) {
    return key in cacheData;
}
function mergeInternalComponents(components) {
    Object.keys(components).forEach(name => {
        if (name in internalComponents) {
            Object.assign(internalComponents[name], components[name]);
        }
        else {
            internalComponents[name] = components[name];
        }
    });
}
function mergeReconciler(hostConfig) {
    Object.keys(hostConfig).forEach(key => {
        const value = hostConfig[key];
        const raw = defaultReconciler[key];
        if (!raw) {
            defaultReconciler[key] = value;
        }
        else {
            if (isArray(raw)) {
                defaultReconciler[key] = raw.push(value);
            }
            else {
                defaultReconciler[key] = [raw, value];
            }
        }
    });
}
function unsupport(api) {
    return function () {
        console.warn(`小程序暂不支持 ${api}`);
    };
}
function setUniqueKeyToRoute(key, obj) {
    const routerParamsPrivateKey = '__key_';
    const useDataCacheApis = [
        'navigateTo',
        'redirectTo',
        'reLaunch',
        'switchTab'
    ];
    if (useDataCacheApis.indexOf(key) > -1) {
        const url = obj.url = obj.url || '';
        const hasMark = url.indexOf('?') > -1;
        const cacheKey = getUniqueKey();
        obj.url += (hasMark ? '&' : '?') + `${routerParamsPrivateKey}=${cacheKey}`;
    }
}

/**
 * Fork from @tarojs/shared for generating base template
 *
 * 这里我们需要关心的小程序种类有两类：
 * 1. 模板递归：
 *  - 支持：tmpl0 套 tmpl0
 *  - 不支持：这就使得我们必须生成多级的模板，tmpl0 套 tmpl1，tmpl1 套 tmpl2……
 *           直到超过阈值 N (N = config.miniapp.baseLevel) tmplN 会套组件 comp，组件 comp 重新再套 tmpl0。
 * 2. 小程序脚本语言（wxs, sjs, etc...）：
 *  - 支持：可以在模板使用函数缩减模板大小或提高性能（存疑），例如判断一个值是不是假值（falsy value）。
 *         将来或许会把数据序列化^1 的操作也放到小程序脚本语言里。
 *  - 不支持：使用纯 *xml 语法
 *
*/
const weixinAdapter = {
    if: 'wx:if',
    else: 'wx:else',
    elseif: 'wx:elif',
    for: 'wx:for',
    forItem: 'wx:for-item',
    forIndex: 'wx:for-index',
    key: 'wx:key',
    xs: 'wxs',
    type: 'weapp'
};
class BaseTemplate {
    constructor() {
        this.exportExpr = 'module.exports =';
        this.supportXS = false; // 是否支持小程序的 wxs 语法
        this.Adapter = weixinAdapter;
        /** 组件列表 */
        this.internalComponents = internalComponents;
        /** 可以 focus 聚焦的组件 */
        this.focusComponents = focusComponents;
        /** 不需要渲染子节点的元素 */
        this.voidElements = voidElements;
        /** 可以递归调用自身的组件 */
        this.nestElements = nestElements;
        this.buildPageTemplate = (baseTempPath) => {
            const template = `<import src="${baseTempPath}"/>
<template is="mpx_tmpl" data="{{${this.dataKeymap('r:r')}}}" />`;
            return template;
        };
        // 辅助模板递归渲染的 comp 模板
        this.buildBaseComponentTemplate = (ext) => {
            const data = !this.isSupportRecursive && this.supportXS
                ? this.dataKeymap('i:i,l:l')
                : this.dataKeymap('i:i');
            return `<import src="./base${ext}" />
<template is="tmpl_0_${"container" /* Container */}" data="{{${data}}}" />`;
        };
        // 辅助自定义组件递归渲染的模板(custom-wrapper)
        this.buildCustomComponentTemplate = (ext) => {
            const Adapter = this.Adapter;
            const data = !this.isSupportRecursive && this.supportXS
                ? `${this.dataKeymap('i:item,l:\'\'')}`
                : this.dataKeymap('i:item');
            return `<import src="./base${ext}" />
  <block ${Adapter.for}="{{i.${"children" /* Children */}}}" ${Adapter.key}="index">
    <template is="tmpl_0_container" data="{{${data}}}" />
  </block>`;
        };
        this.buildXScript = () => {
            return `${this.exportExpr} {
  a: ${this.buildXSTmplName()},
  b: function (a, b) {
    return a === undefined ? b : a
  },
  c: function(i, prefix) {
    var s = i.focus !== undefined ? 'focus' : 'blur'
    return prefix + i.${"nodeType" /* NodeTypeNew */} + '_' + s
  },
  d: function (i, v) {
    return i === undefined ? v : i
  },
  e: function (n) {
    return 'tmpl_' + n + '_${"container" /* Container */}'
  },
  ${this.buildXSTmpExtra()}
}`;
        };
    }
    buildAttribute(attrs, nodeName) {
        return Object.keys(attrs)
            .map(k => {
            if (k === 'rawTag') {
                return '';
            }
            return `${k}="${k.startsWith('bind') || k.startsWith('on') || k.startsWith('catch') || k.startsWith('capture') ? attrs[k] : `{${this.getAttrValue(attrs[k], k, nodeName)}}`}" `;
        })
            .join('');
    }
    replacePropName(name, value, _componentName) {
        if (value === '__invoke')
            return name.toLowerCase();
        return name;
    }
    createMiniComponents(components) {
        const result = Object.create(null);
        for (const key in components) {
            if (hasOwn(components, key)) {
                let component = components[key];
                const compName = toDashed(key);
                const newComp = Object.create(null);
                if (isFunction(this.modifyCompProps)) {
                    component = this.modifyCompProps(compName, component);
                }
                for (let prop in component) {
                    if (hasOwn(component, prop)) {
                        let propValue = component[prop];
                        // 事件绑定
                        if (/^(bind|catch|capture-bind|capture-catch):?(.*?)(?:\.(.*))?$/.exec(prop)) {
                            propValue = '__invoke';
                        }
                        else if (prop === 'rawTag') ;
                        else if (propValue === '') {
                            // <button primary></button> 单属性值的处理
                            propValue = `i.data.${toCamelCase(prop)}`;
                        }
                        else if (isBooleanStringLiteral(propValue) || isNumber(+propValue)) {
                            propValue = this.supportXS
                                ? `xs.b(i.data.${toCamelCase(prop)},${propValue})`
                                : `i.data.${toCamelCase(prop)}===undefined?${propValue}:i.data.${toCamelCase(prop)}`;
                        }
                        else {
                            propValue = `i.data.${toCamelCase(prop)}||${propValue || singleQuote('')}`;
                        }
                        prop = this.replacePropName(prop, propValue, compName);
                        newComp[prop] = propValue;
                    }
                }
                // TODO：可以优化？不一定需要默认添加这些属性，可以按需
                // 添加默认的属性，style / class / events 相关
                if (compName !== 'block') {
                    Object.assign(newComp, styles, this.getEvents());
                }
                // swiper-item 去除 style 配置
                if (compName === 'swiper-item') {
                    delete newComp.style;
                }
                if (compName === 'slot' || compName === 'slot-view') {
                    result[compName] = {
                        slot: 'i.data.name'
                    };
                }
                else {
                    result[compName] = newComp;
                }
            }
        }
        return result;
    }
    // 递归生成基础模板，被注入到 base.wxml 当中的文本内容
    buildBaseTemplate() {
        return `${this.buildXsTemplate()}
<template name="mpx_tmpl">
  <element r="{{r}}" wx:if="{{r}}"></element>
</template>
`;
    }
    buildThirdPartyAttr(attrs) {
        return Array.from(attrs).reduce((str, attr) => {
            if (attr.startsWith('@')) {
                // vue2
                let value = attr.slice(1);
                if (value.indexOf('-') > -1) {
                    value = `:${value}`;
                }
                return str + `bind${value}="__invoke" `;
            }
            else if (attr.startsWith('bind')) { // 事件统一走代理的模式
                return str + `${attr}="__invoke" `;
            }
            else if (attr.startsWith('on')) {
                // react, vue3
                let value = toKebabCase(attr.slice(2));
                if (value.indexOf('-') > -1) {
                    // 兼容如 vant 某些组件的 bind:a-b 这类属性
                    value = `:${value}`;
                }
                return str + `bind${value}="__invoke" `;
            }
            let strVal = '';
            switch (attr) {
                case 'mpxAttrs':
                    strVal = '"{{ i.data }}"';
                    break;
                case 'mpxShow':
                    strVal = '"{{ i.data.mpxShow === undefined ? true : i.data.mpxShow }}"';
                    break;
                default:
                    strVal = `"{{ i.data.${toCamelCase(attr)} }}"`;
                    break;
            }
            return str + `${attr}=${strVal} `;
        }, '');
    }
    buildComponentTemplate(comp, level) {
        return this.focusComponents.has(comp.nodeName)
            ? this.buildFocusComponentTemplte(comp, level)
            : this.buildStandardComponentTemplate(comp, level);
    }
    getChildren(comp, level) {
        const { isSupportRecursive, Adapter, supportXS } = this;
        const nextLevel = isSupportRecursive ? 0 : level + 1;
        const data = !this.isSupportRecursive && supportXS
            ? `${this.dataKeymap('i:item,l:l')}`
            : this.dataKeymap('i:item');
        let child = supportXS
            ? `<template is="{{xs.e(${isSupportRecursive ? 0 : 'cid+1'})}}" data="{{${data}}}" />`
            : `<template is="tmpl_${nextLevel}_${"container" /* Container */}" data="{{${data}}}" />`;
        if (isFunction(this.modifyLoopBody)) {
            child = this.modifyLoopBody(child, comp.nodeName);
        }
        let children = this.voidElements.has(comp.nodeName)
            ? ''
            : `
    <block ${Adapter.for}="{{i.${"children" /* Children */}}}" ${Adapter.key}="index">
      ${child}
    </block>
  `;
        if (isFunction(this.modifyLoopContainer)) {
            children = this.modifyLoopContainer(children, comp.nodeName);
        }
        return children;
    }
    buildFocusComponentTemplte(comp, level) {
        const children = this.getChildren(comp, level);
        const attrs = Object.assign({}, comp.attributes);
        const templateName = this.supportXS
            ? `xs.c(i, 'tmpl_${level}_')`
            : `i.focus ? 'tmpl_${level}_${comp.nodeName}_focus' : 'tmpl_${level}_${comp.nodeName}_blur'`;
        delete attrs.focus;
        let res = `
<template name="tmpl_${level}_${comp.nodeName}">
  <template is="{{${templateName}}}" data="{{${this.dataKeymap('i:i')}${children ? ',cid:cid' : ''}}}" />
</template>

<template name="tmpl_${level}_${comp.nodeName}_focus">
  <${comp.nodeName} ${this.buildAttribute(comp.attributes, comp.nodeName)} data-mpxuid="{{i.data.uid}}">${children}</${comp.nodeName}>
</template>

<template name="tmpl_${level}_${comp.nodeName}_blur">
  <${comp.nodeName} ${this.buildAttribute(attrs, comp.nodeName)} data-mpxuid="{{i.data.uid}}">${children}</${comp.nodeName}>
</template>
`;
        if (isFunction(this.modifyTemplateResult)) {
            res = this.modifyTemplateResult(res, comp.nodeName, level, children);
        }
        return res;
    }
    buildStandardComponentTemplate(comp, level) {
        const children = this.getChildren(comp, level);
        let nodeName = '';
        switch (comp.nodeName) {
            case 'slot':
            case 'slot-view':
            case 'catch-view':
            case 'static-view':
            case 'pure-view':
                nodeName = 'view';
                break;
            case 'static-text':
                nodeName = 'text';
                break;
            case 'static-image':
                nodeName = 'image';
                break;
            default:
                if (comp.attributes.rawTag) {
                    nodeName = comp.attributes.rawTag;
                }
                else {
                    nodeName = comp.nodeName;
                }
                break;
        }
        let res = `
<template name="tmpl_${level}_${comp.nodeName}">
  <${nodeName} ${this.buildAttribute(comp.attributes, comp.nodeName)} data-mpxuid="{{i.data.uid}}">${children}</${nodeName}>
</template>
`;
        if (isFunction(this.modifyTemplateResult)) {
            res = this.modifyTemplateResult(res, comp.nodeName, level, children);
        }
        return res;
    }
    buildPlainTextTemplate(level) {
        return `
<template name="tmpl_${level}_#text" data="{{${this.dataKeymap('i:i')}}}">
  <block>{{i.${"content" /* TextNew */}}}</block>
</template>
`;
    }
    // 包括 custom-wrapper、原生的小程序组件、第三方(例如 vant)的组件
    buildThirdPartyTemplate(level, componentConfig) {
        const { Adapter, isSupportRecursive, supportXS, nestElements } = this;
        const nextLevel = isSupportRecursive ? 0 : level + 1;
        let template = '';
        const data = !isSupportRecursive && supportXS
            ? `${this.dataKeymap('i:item,l:l')}`
            : this.dataKeymap('i:item');
        componentConfig.thirdPartyComponents.forEach((attrs, compName) => {
            if (compName === 'custom-wrapper') {
                template += `
<template name="tmpl_${level}_${compName}">
  <${compName} i="{{i}}" l="{{l}}" data-mpxuid="{{i.data.uid}}">
  </${compName}>
</template>
  `;
            }
            else {
                if (!isSupportRecursive && supportXS && nestElements.has(compName) && level + 1 > nestElements.get(compName))
                    return;
                const child = supportXS
                    ? `<template is="{{xs.e(${isSupportRecursive ? 0 : 'cid+1'})}}" data="{{${data}}}" />`
                    : `<template is="tmpl_${nextLevel}_${"container" /* Container */}" data="{{${data}}}" />`;
                // TODO: 需要根据组件的特性（非运行时/运行时组件）动态生成对应的模板内容
                template += `
<template name="tmpl_${level}_${compName}">
  <${compName} ${this.buildThirdPartyAttr(attrs)} data-mpxuid="{{i.data.uid}}">
    <block ${Adapter.for}="{{i.${"children" /* Children */}}}" ${Adapter.key}="index">
      <block wx:if="{{ item.data['slot'] }}">
        <view slot="{{ item.data['slot'] }}">
          ${child}
        </view>
      </block>
      <block wx:else>
        ${child}
      </block>
    </block>
  </${compName}>
</template>
  `;
            }
        });
        componentConfig.runtimeComponents.forEach((attrs, compName) => {
            if (!isSupportRecursive && supportXS && nestElements.has(compName) && level + 1 > nestElements.get(compName))
                return;
            template += `
<template name="tmpl_${level}_${compName}">
  <${compName} ${this.buildThirdPartyAttr(attrs)} data-mpxuid="{{i.data.uid}}"></${compName}>
</template>
  `;
        });
        return template;
    }
    buildBlockTemplate(level) {
        const { Adapter, isSupportRecursive, supportXS } = this;
        const nextLevel = isSupportRecursive ? 0 : level + 1;
        const data = !isSupportRecursive && supportXS
            ? `${this.dataKeymap('i:item,l:\'\'')}`
            : this.dataKeymap('i:item');
        return `
<template name="tmpl_${level}_block">
  <block ${Adapter.for}="{{i.children}}" ${Adapter.key}="index">
    <template is="tmpl_${nextLevel}_${"container" /* Container */}" data="{{${data}}}" />
  </block>
</template>
`;
    }
    buildContainerTemplate(level, restart = false) {
        let tmpl = '';
        if (restart) {
            tmpl = `<block ${this.Adapter.if}="{{i.nodeType === '#text'}}">
    <template is="tmpl_0_#text" data="{{i:i}}" />
  </block>
  <block ${this.Adapter.else}>
    ${!this.isSupportRecursive && this.supportXS ? '<element i="{{i}}" l="{{l}}" />' : '<element r="{{i}}" />'}
  </block>`;
        }
        else {
            const xs = !this.isSupportRecursive
                ? `xs.a(${level}, i.${"nodeType" /* NodeTypeNew */}, l)`
                : `xs.a(${level}, i.${"nodeType" /* NodeTypeNew */})`;
            const data = !this.isSupportRecursive
                ? `${this.dataKeymap(`i:i,cid:${level},l:xs.f(l,i.${"nodeType" /* NodeTypeNew */})`)}`
                : `${this.dataKeymap('i:i')}`;
            tmpl = this.supportXS
                ? `<template is="{{${xs}}}" data="{{${data}}}" />`
                : `<template is="{{'tmpl_${level}_' + i.${"nodeType" /* NodeTypeNew */}}}" data="{{${this.dataKeymap('i:i')}}}" />`;
        }
        return `
<template name="tmpl_${level}_${"container" /* Container */}">
  ${tmpl}
</template>
`;
    }
    dataKeymap(keymap) {
        return keymap;
    }
    getEvents() {
        return events;
    }
    getAttrValue(value, _key, _nodeName) {
        return `{${value}}`;
    }
    buildXsTemplate() {
        return '';
    }
    mergeComponents(ctx, patch) {
        ctx.helper.recursiveMerge(this.internalComponents, patch);
    }
    buildXSTmplName() {
        return `function (l, n) {
    return 'tmpl_' + l + '_' + n
  }`;
    }
    buildXSTmpExtra() {
        return '';
    }
}
class RecursiveTemplate extends BaseTemplate {
    constructor() {
        super(...arguments);
        this.isSupportRecursive = true;
        this.buildTemplate = (componentConfig) => {
            let template = this.buildBaseTemplate();
            this.miniComponents = this.createMiniComponents(componentConfig);
            const ZERO_FLOOR = 0;
            const components = Object.keys(this.miniComponents)
                .filter(c => componentConfig.includes.size && !componentConfig.includeAll ? componentConfig.includes.has(c) : true);
            template = components.reduce((current, nodeName) => {
                const attributes = this.miniComponents[nodeName];
                return current + this.buildComponentTemplate({ nodeName, attributes }, ZERO_FLOOR);
            }, template);
            template += this.buildPlainTextTemplate(ZERO_FLOOR);
            template += this.buildThirdPartyTemplate(ZERO_FLOOR, componentConfig);
            template += this.buildContainerTemplate(ZERO_FLOOR);
            return template;
        };
    }
}
class UnRecursiveTemplate extends BaseTemplate {
    constructor() {
        super(...arguments);
        this.isSupportRecursive = false;
        this._baseLevel = 8;
        this.buildTemplate = (componentConfig) => {
            this.componentConfig = componentConfig;
            // createMiniComponents 方法会创建出 view -> static-view / pure-view | text -> static-text 等节点的配置
            // miniComponents 包含了需要被渲染出来的组件
            this.miniComponents = this.createMiniComponents(componentConfig.internalComponents);
            const components = Object.keys(this.miniComponents);
            let template = this.buildBaseTemplate(); // 生成入口模板
            for (let i = 0; i < this.baseLevel; i++) { // 生成层级模板
                template += this.supportXS
                    ? this.buildOptimizeFloor(i, components, this.baseLevel === i + 1)
                    : this.buildFloor(i, components, this.baseLevel === i + 1);
            }
            return template;
        };
    }
    set baseLevel(lv) {
        this._baseLevel = lv;
    }
    get baseLevel() {
        return this._baseLevel;
    }
    buildFloor(level, components, restart = false) {
        if (restart)
            return this.buildContainerTemplate(level, restart);
        let template = this.buildBlockTemplate(level);
        template += components.reduce((current, nodeName) => {
            const attributes = this.miniComponents[nodeName];
            return current + this.buildComponentTemplate({ nodeName, attributes }, level);
        }, '');
        template += this.buildPlainTextTemplate(level);
        template += this.buildThirdPartyTemplate(level, this.componentConfig);
        template += this.buildContainerTemplate(level, restart);
        return template;
    }
    buildOptimizeFloor(level, components, restart = false) {
        if (restart)
            return this.buildContainerTemplate(level, restart);
        let template = components.reduce((current, nodeName) => {
            if (level !== 0) {
                if (!this.nestElements.has(nodeName)) {
                    // 不可嵌套自身的组件只需输出一层模板 -> 例如 slider、switch 这种功能组件
                    return current;
                }
                else {
                    // 部分可嵌套自身的组件实际上不会嵌套过深，这里按阈值限制层数 -> 例如 scroll-view、swiper 这种可自身嵌套的组件
                    const max = this.nestElements.get(nodeName);
                    if (max > 0 && level >= max) {
                        return current;
                    }
                }
            }
            // 根据 nodeName 和 attributes 来构建模板
            const attributes = this.miniComponents[nodeName];
            return current + this.buildComponentTemplate({ nodeName, attributes }, level);
        }, '');
        // <text> 节点模板
        if (level === 0)
            template += this.buildPlainTextTemplate(level);
        // 构建自定义组件的模板
        template += this.buildThirdPartyTemplate(level, this.componentConfig);
        template += this.buildContainerTemplate(level);
        return template;
    }
    buildXSTmplName() {
        const isLoopComps = [
            ...Array.from(this.nestElements.keys()),
            ...Array.from(this.componentConfig.thirdPartyComponents.keys()),
            ...Array.from(this.componentConfig.runtimeComponents.keys())
        ];
        const isLoopCompsSet = new Set(isLoopComps); // 可递归循环的组件
        const hasMaxComps = []; // 有最大递归循环数限制的组件
        this.nestElements.forEach((max, comp) => {
            if (max > 1) {
                hasMaxComps.push(comp);
            }
            else if (max === 1 && isLoopCompsSet.has(comp)) {
                isLoopCompsSet.delete(comp);
            }
        });
        return `function (l, n, s) {
    var a = ${JSON.stringify(Array.from(isLoopCompsSet))}
    var b = ${JSON.stringify(hasMaxComps)}
    if (a.indexOf(n) === -1) {
      l = 0
    }
    if (b.indexOf(n) > -1) {
      var u = s.split(',')
      var depth = 0
      for (var i = 0; i < u.length; i++) {
        if (u[i] === n) depth++
      }
      l = depth
    }
    return 'tmpl_' + l + '_' + n
  }`;
    }
    buildXSTmpExtra() {
        const hasMaxComps = [];
        this.nestElements.forEach((max, comp) => {
            if (max > 1)
                hasMaxComps.push(comp);
        });
        return `f: function (l, n) {
    var b = ${JSON.stringify(hasMaxComps)}
    if (b.indexOf(n) > -1) {
      if (l) l += ','
      l += n
    }
    return l
  }`;
    }
}

exports.BaseTemplate = BaseTemplate;
exports.EMPTY_ARR = EMPTY_ARR;
exports.EMPTY_OBJ = EMPTY_OBJ;
exports.RecursiveTemplate = RecursiveTemplate;
exports.UnRecursiveTemplate = UnRecursiveTemplate;
exports.animationEvents = animationEvents;
exports.box = box;
exports.cacheDataGet = cacheDataGet;
exports.cacheDataHas = cacheDataHas;
exports.cacheDataSet = cacheDataSet;
exports.capitalize = capitalize;
exports.controlledComponent = controlledComponent;
exports.defaultReconciler = defaultReconciler;
exports.events = events;
exports.focusComponents = focusComponents;
exports.getUniqueKey = getUniqueKey;
exports.hasOwn = hasOwn;
exports.internalComponents = internalComponents;
exports.isArray = isArray;
exports.isBoolean = isBoolean;
exports.isBooleanStringLiteral = isBooleanStringLiteral;
exports.isFunction = isFunction;
exports.isNull = isNull;
exports.isNumber = isNumber;
exports.isObject = isObject;
exports.isString = isString;
exports.isUndefined = isUndefined;
exports.mergeInternalComponents = mergeInternalComponents;
exports.mergeReconciler = mergeReconciler;
exports.nestElements = nestElements;
exports.noop = noop;
exports.queryToJson = queryToJson;
exports.setUniqueKeyToRoute = setUniqueKeyToRoute;
exports.singleQuote = singleQuote;
exports.styles = styles;
exports.toCamelCase = toCamelCase;
exports.toDashed = toDashed;
exports.toKebabCase = toKebabCase;
exports.touchEvents = touchEvents;
exports.unbox = unbox;
exports.unsupport = unsupport;
exports.voidElements = voidElements;
exports.warn = warn;
