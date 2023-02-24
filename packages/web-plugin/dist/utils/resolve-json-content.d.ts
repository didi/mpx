import { CompilerResult } from '@mpxjs/compiler';
import { ProxyPluginContext } from '@mpxjs/plugin-proxy';
import { TransformPluginContext } from 'rollup';
import { Options } from '../options';
import { JsonConfig } from '../types/json-config';
export declare function evalJSONJS(source: string, filename: string, defs: Record<string, any>, fs: any, callback: (filename: string) => void): Record<string, {
    exports: any;
}>;
export declare function getJSONContent(json: CompilerResult['json'], filename: string, pluginContext: ProxyPluginContext, defs: Record<string, any> | unknown, fs: any): Promise<{
    content: string;
    path: string;
}>;
/**
 * resolve json content
 * @param descriptor - SFCDescriptor
 * @param pluginContext - TransformPluginContext
 * @param options - ResolvedOptions
 * @returns json config
 */
export default function resolveJson(compilerResult: CompilerResult, context: string, pluginContext: TransformPluginContext, options: Options, fsInfo?: any): Promise<JsonConfig & {
    path: string;
}>;
