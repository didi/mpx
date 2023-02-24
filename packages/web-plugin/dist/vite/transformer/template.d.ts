import { TransformPluginContext } from 'rollup';
import { TransformResult } from 'vite';
import { Options } from '../../options';
import { SFCDescriptor } from '../utils/descriptorCache';
/**
 * transform mpx template to vue template
 * @param code - mpx template code
 * @param filename - filename
 * @param descriptor - SFCDescriptor
 * @param options - ResolvedOptions
 * @param pluginContext - TransformPluginContext
 */
export declare function transformTemplate(descriptor: SFCDescriptor, options: Options, pluginContext?: TransformPluginContext): Promise<TransformResult | undefined>;
/**
 * gen template block
 * @param descriptor - SFCDescriptor
 * @returns <template>descriptor.template.content</template>
 */
export declare function genTemplateBlock(descriptor: SFCDescriptor, options: Options, pluginContext?: TransformPluginContext): Promise<{
    output: string;
}>;
