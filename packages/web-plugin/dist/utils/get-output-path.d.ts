import { Options } from '../options';
export default function getOutputPath(resourcePath: string, type: string, options: Options, { ext, conflictPath }?: {
    ext?: string | undefined;
    conflictPath?: string | undefined;
}): string;
