import { Plugin as EsbuildPlugin } from 'esbuild';
import { Plugin } from 'vite';
import { Options } from '../../options';
export interface CustomExtensionsOptions {
    include: RegExp;
    extensions: string[];
    fileConditionRules: Options['fileConditionRules'];
}
export declare function esbuildCustomExtensionsPlugin(options: CustomExtensionsOptions): EsbuildPlugin;
/**
 * add custom extensions plugin
 * @param options - options
 * @returns vite plugin options
 */
export declare function customExtensionsPlugin(options: CustomExtensionsOptions): Plugin;
