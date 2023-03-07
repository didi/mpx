import { ProxyPluginContext } from '@mpxjs/plugin-proxy';
import load from 'postcss-load-config';
export declare const MPX_ROOT_VIEW = "mpx-root-view";
export declare const MPX_APP_MODULE_ID = "mpx-app-scope";
declare const transform: (css: string, pluginContext: ProxyPluginContext, options: {
    sourceMap?: boolean;
    resource: string;
    mpx: any;
    map: any;
    isApp?: boolean;
}) => Promise<{
    code: string;
    map: any;
}>;
export interface StyleCompiler {
    pluginCondStrip: (...args: any[]) => load.ResultPlugin;
    rpx: (...args: any[]) => load.ResultPlugin;
    scopeId: (...args: any[]) => load.ResultPlugin;
    transSpecial: (...args: any[]) => load.ResultPlugin;
    trim: (...args: any[]) => load.ResultPlugin;
    vw: (...args: any[]) => load.ResultPlugin;
    loadPostcssConfig: (...args: any[]) => Promise<Record<string, any>>;
    transform: typeof transform;
}
declare const styleCompiler: StyleCompiler;
export default styleCompiler;
