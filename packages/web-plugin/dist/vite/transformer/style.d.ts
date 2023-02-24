import { TransformPluginContext } from 'rollup';
import { Options } from '../../options';
import { TransformResult } from 'vite';
import { SFCDescriptor } from '../utils/descriptorCache';
/**
 * transform style
 * @param code - style code
 * @param filename - filename
 * @param descriptor - SFCDescriptor
 * @param options - ResolvedOptions
 * @param pluginContext - TransformPluginContext
 */
export declare function transformStyle(code: string, filename: string, descriptor: SFCDescriptor, options: Options, pluginContext: TransformPluginContext): Promise<TransformResult | undefined>;
/**
 * generate style block
 * @param descriptor - SFCDescriptor
 * @returns <style>descriptor.style</style>
 */
export declare function genStylesBlock(descriptor: SFCDescriptor): {
    output: string;
};
