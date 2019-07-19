// Type definitions for @mpxjs/core
// Project: https://didi.github.io/mpx/api.html
// Definitions by: skyadmin <https://github.com/sky-admin>
// Definitions: https://github.com/DefinitelyTyped/DefinitelyTyped
// TypeScript Version: 2.8

// import typing files using '///'
///import wx from 'weixin-app'

interface storeConfig {
    state?: Object,
    getters?: Object,
    actions?: Object,
    mutations?: Object,
}

interface storeInstance {
    mapGetters(getters: Array<string>): Array<Function>;

    mapMutations(getters: Array<string>): Array<Function>;

    mapActions(getters: Array<string>): Array<Function>;

    mapState(getters: Array<string>): Array<Function>;
}

export function createApp(option?: wx.AppOptions): wx.App;

export function createPage(option?: wx.PageOptions): wx.Page;

export function createComponent(option?: wx.PageOptions): wx.Component<Object, Object>;

export function createStore(option: storeConfig): storeInstance;
