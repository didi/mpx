import { LoaderContext } from 'webpack';
import { JsonConfig } from '../../types/json-config';
export default function (jsonConfig: JsonConfig, { loaderContext }: {
    loaderContext: LoaderContext<null>;
}, rawCallback: (err?: Error | null, result?: any) => void): Promise<void>;
