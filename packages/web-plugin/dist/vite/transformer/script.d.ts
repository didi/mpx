import { SourceMap, TransformPluginContext } from 'rollup';
import { Options } from 'src/options';
import { SFCDescriptor } from '../utils/descriptorCache';
export declare const genComponentCode: (varName: string, resource: string, { async }?: {
    async?: boolean | undefined;
}, params?: unknown) => string;
/**
 * transform mpx script
 * @param code - mpx script content
 * @param descriptor - SFCDescriptor
 * @param options - ResolvedOptions
 * @param pluginContext - TransformPluginContext
 * @returns script content
 */
export declare function transformScript(descriptor: SFCDescriptor, options: Options, pluginContext: TransformPluginContext): Promise<{
    code: string;
    map?: SourceMap;
}>;
/**
 * generate script block and transform script content
 * @param descriptor - SFCDescriptor
 * @param options - ResolvedOptions
 * @param pluginContext - TransformPluginContext
 */
export declare function genScriptBlock(descriptor: SFCDescriptor, code: string): Promise<{
    output: string;
}>;
