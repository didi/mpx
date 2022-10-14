"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const loader_utils_1 = __importDefault(require("loader-utils"));
const add_query_1 = __importDefault(require("./add-query"));
const parse_request_1 = __importDefault(require("./parse-request"));
const selectorPath = '@mpxjs/loaders/dist/selector';
const defaultLang = {
    template: 'wxml',
    styles: 'wxss',
    script: 'js',
    json: 'json',
    wxs: 'wxs'
};
function createHelpers(loaderContext) {
    const rawRequest = loader_utils_1.default.getRemainingRequest(loaderContext);
    const { resourcePath, queryObj } = (0, parse_request_1.default)(loaderContext.resource);
    // @ts-ignore
    const { mode, env } = loaderContext.getMpx() || {};
    function getRequire(type, part, extraOptions, index) {
        return 'require(' + getRequestString(type, part, extraOptions, index) + ')';
    }
    function getImport(type, part, extraOptions, index) {
        return ('import __' + type + '__ from ' +
            getRequestString(type, part, extraOptions, index));
    }
    function getNamedExports(type, part, extraOptions, index) {
        return ('export * from ' +
            getRequestString(type, part, extraOptions, index));
    }
    function getFakeRequest(type, part) {
        const lang = part.lang || defaultLang[type] || type;
        const options = { ...queryObj };
        if (lang === 'json')
            options.asScript = true;
        return (0, add_query_1.default)(`${resourcePath}.${lang}`, options);
    }
    function getRequestString(type, part, extraOptions, index = 0) {
        const src = part.src;
        const options = {
            mpx: true,
            type,
            index,
            ...extraOptions
        };
        switch (type) {
            case 'json':
                options.asScript = true;
                if (part.useJSONJS)
                    options.useJSONJS = true;
            // eslint-disable-next-line no-fallthrough
            case 'styles':
            case 'template':
                options.extract = true;
        }
        if (part.mode)
            options.mode = part.mode;
        if (src) {
            return loader_utils_1.default.stringifyRequest(loaderContext, (0, add_query_1.default)(src, options, true));
        }
        else {
            const fakeRequest = getFakeRequest(type, part);
            const request = `${selectorPath}?mode=${mode}&env=${env}!${(0, add_query_1.default)(rawRequest, options, true)}`;
            return loader_utils_1.default.stringifyRequest(loaderContext, `${fakeRequest}!=!${request}`);
        }
    }
    return {
        getRequire,
        getImport,
        getNamedExports,
        getRequestString
    };
}
exports.default = createHelpers;
//# sourceMappingURL=helpers.js.map
module.exports.default && (module.exports = module.exports.default)
