import { LoaderContext } from 'webpack';
import { JsonConfig } from '../../types/json-config';
import { JsonTransfromResult } from '../../transfrom/json-compiler';
import { TemplateTransformResult } from '../../transfrom/template-compiler';
import { CompilerResult } from '@mpxjs/compiler';
export default function (script: CompilerResult['script'] | null, { loaderContext, ctorType, moduleId, componentGenerics, jsonConfig, outputPath, tabBarMap, builtInComponentsMap, genericsInfo, wxsModuleMap, localComponentsMap, localPagesMap }: {
    loaderContext: LoaderContext<null> | any;
    moduleId: string;
    ctorType: string;
    outputPath: string;
    componentGenerics: JsonConfig['componentGenerics'];
    tabBarMap: JsonTransfromResult['tabBarMap'];
    jsonConfig: JsonConfig;
    builtInComponentsMap: TemplateTransformResult['builtInComponentsMap'];
    genericsInfo: TemplateTransformResult['genericsInfo'];
    wxsModuleMap: TemplateTransformResult['wxsModuleMap'];
    localComponentsMap: JsonTransfromResult['localPagesMap'];
    localPagesMap: JsonTransfromResult['localPagesMap'];
}, callback: (err?: Error | null, result?: any) => void): void;
