import { CompilerResult, JsonConfig } from '@mpxjs/compiler';
import { LoaderContext } from 'webpack';
import { JsonProcessResult } from '../../processor/json-process';
import { TemplateProcessResult } from '../../processor/template-process';
export default function (script: CompilerResult['script'] | null, { loaderContext, ctorType, moduleId, componentGenerics, jsonConfig, outputPath, tabBarMap, builtInComponentsMap, genericsInfo, wxsModuleMap, localComponentsMap, localPagesMap }: {
    loaderContext: LoaderContext<null> | any;
    moduleId: string;
    ctorType: string;
    outputPath: string;
    componentGenerics: JsonConfig['componentGenerics'];
    tabBarMap: JsonProcessResult['tabBarMap'];
    jsonConfig: JsonConfig;
    builtInComponentsMap: TemplateProcessResult['builtInComponentsMap'];
    genericsInfo: TemplateProcessResult['genericsInfo'];
    wxsModuleMap: TemplateProcessResult['wxsModuleMap'];
    localComponentsMap: JsonProcessResult['localPagesMap'];
    localPagesMap: JsonProcessResult['localPagesMap'];
}, callback: (err?: Error | null, result?: any) => void): void;
