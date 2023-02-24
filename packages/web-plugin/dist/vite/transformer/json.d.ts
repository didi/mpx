import { TransformPluginContext } from 'rollup';
import { Options } from '../../options';
import { SFCDescriptor } from '../utils/descriptorCache';
export declare function processJSON(descriptor: SFCDescriptor, options: Options, pluginContext: TransformPluginContext): Promise<void>;
