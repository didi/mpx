import { ProxyPluginContext } from '@mpxjs/plugin-proxy';
import { CompilerResult } from '../template-compiler';
import { JsonConfig } from './json-config';
export * from './json-config';
export declare const DEFAULT_TAB_BAR_CONFIG: {
    borderStyle: string;
    position: string;
    custom: boolean;
    isShow: boolean;
};
export declare const JSON_JS_EXT = ".json.js";
/**
 * resolve json content
 * @param descriptor - SFCDescriptor
 * @param pluginContext - TransformPluginContext
 * @param options - ResolvedOptions
 * @returns json config
 */
declare function parse(compilerResult: CompilerResult, context: string, pluginContext: ProxyPluginContext, defs: any, fsInfo?: any): Promise<JsonConfig & {
    path: string;
}>;
declare const jsonCompiler: {
    parse: typeof parse;
};
export default jsonCompiler;
