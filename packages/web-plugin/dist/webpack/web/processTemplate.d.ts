import { LoaderContext } from 'webpack';
import { JsonConfig } from '../../types/json-config';
import { CompilerResult } from '@mpxjs/compiler';
export default function (template: CompilerResult['template'], { loaderContext, moduleId, ctorType, jsonConfig }: {
    loaderContext: LoaderContext<null>;
    moduleId: string;
    ctorType: string;
    jsonConfig: JsonConfig;
}, callback: (err?: Error | null, result?: any) => void): void;
