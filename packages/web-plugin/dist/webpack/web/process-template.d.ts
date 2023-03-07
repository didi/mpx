import { CompilerResult, JsonConfig } from '@mpxjs/compiler';
import { LoaderContext } from 'webpack';
export default function (template: CompilerResult['template'], { loaderContext, moduleId, ctorType, jsonConfig }: {
    loaderContext: LoaderContext<null>;
    moduleId: string;
    ctorType: string;
    jsonConfig: JsonConfig;
}, callback: (err?: Error | null, result?: any) => void): void;
