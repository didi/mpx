"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const run_rules_1 = __importDefault(require("../../run-rules"));
const normalize_test_1 = __importDefault(require("../normalize-test"));
const change_key_1 = __importDefault(require("../change-key"));
const compile_utils_1 = require("@mpxjs/compile-utils");
const mpxViewPath = compile_utils_1.normalize.lib('runtime/components/ali/mpx-view.mpx');
const mpxTextPath = compile_utils_1.normalize.lib('runtime/components/ali/mpx-text.mpx');
function getSpec({ warn, error }) {
    function print(mode, path, isError) {
        const msg = `Json path <${path}> is not supported in ${mode} environment!`;
        isError ? error(msg) : warn(msg);
    }
    function deletePath(opts) {
        let isError = opts;
        let shouldLog = true;
        if (typeof opts === 'object') {
            shouldLog = !opts.noLog;
            isError = opts.isError;
        }
        return function (input, { mode, pathArr = [] }, meta) {
            const currPath = meta.paths.join('|');
            if (shouldLog) {
                print(mode, pathArr.concat(currPath).join('.'), isError);
            }
            meta.paths.forEach((path) => {
                delete input[path];
            });
            return input;
        };
    }
    /**
     * @desc 在app.mpx里配置usingComponents作为全局组件
     */
    function addGlobalComponents(input, { globalComponents }) {
        if (globalComponents) {
            input.usingComponents = Object.assign({}, globalComponents, input.usingComponents);
        }
        return input;
    }
    // 处理支付宝 componentPlaceholder 不支持 view、text 原生标签
    function aliComponentPlaceholderFallback(input) {
        const componentPlaceholder = input.componentPlaceholder;
        const usingComponents = input.usingComponents || (input.usingComponents = {});
        for (const cph in componentPlaceholder) {
            const cur = componentPlaceholder[cph];
            const placeholderCompMatched = cur.match(/^(?:view|text)$/g);
            if (!Array.isArray(placeholderCompMatched))
                continue;
            let compName, compPath;
            switch (placeholderCompMatched[0]) {
                case 'view':
                    compName = 'mpx-view';
                    compPath = mpxViewPath;
                    break;
                case 'text':
                    compName = 'mpx-text';
                    compPath = mpxTextPath;
            }
            usingComponents[compName] = compPath;
            componentPlaceholder[cph] = compName;
        }
        return input;
    }
    const spec = {
        supportedModes: ['ali', 'swan', 'qq', 'tt', 'jd', 'qa', 'dd'],
        normalizeTest: normalize_test_1.default,
        page: [
            {
                test: 'navigationBarTitleText',
                ali(input) {
                    return (0, change_key_1.default)(input, this.test, 'defaultTitle');
                }
            },
            {
                test: 'enablePullDownRefresh',
                ali(input) {
                    input = (0, change_key_1.default)(input, this.test, 'pullRefresh');
                    if (input.pullRefresh) {
                        input.allowsBounceVertical = 'YES';
                    }
                    return input;
                },
                jd: deletePath()
            },
            {
                test: 'navigationBarBackgroundColor',
                ali(input) {
                    return (0, change_key_1.default)(input, this.test, 'titleBarColor');
                }
            },
            {
                test: 'disableSwipeBack',
                ali: deletePath(),
                qq: deletePath(),
                jd: deletePath(),
                swan: deletePath()
            },
            {
                test: 'onReachBottomDistance',
                qq: deletePath(),
                jd: deletePath()
            },
            {
                test: 'disableScroll',
                ali: deletePath(),
                qq: deletePath(),
                jd: deletePath()
            },
            {
                test: 'backgroundColorTop|backgroundColorBottom',
                ali: deletePath(),
                swan: deletePath()
            },
            {
                test: 'navigationBarTextStyle|navigationStyle|backgroundTextStyle',
                ali: deletePath()
            },
            {
                test: 'pageOrientation',
                ali: deletePath(),
                swan: deletePath(),
                tt: deletePath(),
                jd: deletePath()
            },
            {
                test: 'componentPlaceholder',
                ali: aliComponentPlaceholderFallback
            },
            {
                ali: addGlobalComponents,
                swan: addGlobalComponents,
                qq: addGlobalComponents,
                tt: addGlobalComponents,
                jd: addGlobalComponents
            }
        ],
        component: [
            {
                test: 'componentGenerics',
                ali: deletePath(true)
            },
            {
                test: 'componentPlaceholder',
                ali: aliComponentPlaceholderFallback
            },
            {
                ali: addGlobalComponents,
                swan: addGlobalComponents,
                qq: addGlobalComponents,
                tt: addGlobalComponents
            }
        ],
        tabBar: {
            list: [
                {
                    test: 'text',
                    ali(input) {
                        return (0, change_key_1.default)(input, this.test, 'name');
                    }
                },
                {
                    test: 'iconPath',
                    ali(input) {
                        return (0, change_key_1.default)(input, this.test, 'icon');
                    }
                },
                {
                    test: 'selectedIconPath',
                    ali(input) {
                        return (0, change_key_1.default)(input, this.test, 'activeIcon');
                    }
                }
            ],
            rules: [
                {
                    test: 'color',
                    ali(input) {
                        return (0, change_key_1.default)(input, this.test, 'textColor');
                    }
                },
                {
                    test: 'list',
                    ali(input) {
                        const value = input.list;
                        delete input.list;
                        input.items = value.map(item => {
                            return (0, run_rules_1.default)(spec.tabBar.list, item, {
                                mode: 'ali',
                                normalizeTest: normalize_test_1.default,
                                waterfall: true,
                                data: {
                                    pathArr: ['tabBar', 'list']
                                }
                            });
                        });
                        return input;
                    }
                },
                {
                    test: 'position',
                    ali: deletePath(),
                    swan: deletePath()
                },
                {
                    test: 'borderStyle',
                    ali: deletePath()
                },
                {
                    test: 'custom',
                    ali: deletePath(),
                    swan: deletePath(),
                    tt: deletePath(),
                    jd: deletePath()
                }
            ]
        },
        rules: [
            {
                test: 'resizable',
                ali: deletePath(),
                qq: deletePath(),
                swan: deletePath(),
                tt: deletePath(),
                jd: deletePath()
            },
            {
                test: 'preloadRule',
                tt: deletePath(),
                jd: deletePath()
            },
            {
                test: 'functionalPages',
                ali: deletePath(true),
                qq: deletePath(true),
                swan: deletePath(true),
                tt: deletePath(),
                jd: deletePath(true)
            },
            {
                test: 'plugins',
                qq: deletePath(true),
                swan: deletePath(true),
                tt: deletePath(),
                jd: deletePath(true)
            },
            {
                test: 'usingComponents',
                ali: deletePath({ noLog: true }),
                qq: deletePath({ noLog: true }),
                swan: deletePath({ noLog: true }),
                tt: deletePath({ noLog: true }),
                jd: deletePath({ noLog: true })
            },
            {
                test: 'debug',
                ali: deletePath(),
                swan: deletePath()
            },
            {
                test: 'requiredBackgroundModes',
                ali: deletePath(),
                tt: deletePath()
            },
            {
                test: 'workers',
                jd: deletePath(),
                ali: deletePath(),
                swan: deletePath(),
                tt: deletePath()
            },
            {
                test: 'subpackages|subPackages',
                jd: deletePath(true)
            },
            {
                test: 'packages',
                jd: deletePath()
            },
            {
                test: 'navigateToMiniProgramAppIdList|networkTimeout',
                ali: deletePath(),
                jd: deletePath()
            },
            {
                test: 'tabBar',
                ali(input) {
                    input.tabBar = (0, run_rules_1.default)(spec.tabBar, input.tabBar, {
                        mode: 'ali',
                        normalizeTest: normalize_test_1.default,
                        waterfall: true,
                        data: {
                            pathArr: ['tabBar']
                        }
                    });
                },
                qq(input) {
                    input.tabBar = (0, run_rules_1.default)(spec.tabBar, input.tabBar, {
                        mode: 'qq',
                        normalizeTest: normalize_test_1.default,
                        waterfall: true,
                        data: {
                            pathArr: ['tabBar']
                        }
                    });
                },
                swan(input) {
                    input.tabBar = (0, run_rules_1.default)(spec.tabBar, input.tabBar, {
                        mode: 'swan',
                        normalizeTest: normalize_test_1.default,
                        waterfall: true,
                        data: {
                            pathArr: ['tabBar']
                        }
                    });
                },
                tt(input) {
                    input.tabBar = (0, run_rules_1.default)(spec.tabBar, input.tabBar, {
                        mode: 'tt',
                        normalizeTest: normalize_test_1.default,
                        waterfall: true,
                        data: {
                            pathArr: ['tabBar']
                        }
                    });
                },
                jd(input) {
                    input.tabBar = (0, run_rules_1.default)(spec.tabBar, input.tabBar, {
                        mode: 'jd',
                        normalizeTest: normalize_test_1.default,
                        waterfall: true,
                        data: {
                            pathArr: ['tabBar']
                        }
                    });
                }
            },
            {
                test: 'window',
                ali(input) {
                    input.window = (0, run_rules_1.default)(spec.page, input.window, {
                        mode: 'ali',
                        normalizeTest: normalize_test_1.default,
                        waterfall: true,
                        data: {
                            pathArr: ['window']
                        }
                    });
                    return input;
                },
                qq(input) {
                    input.window = (0, run_rules_1.default)(spec.page, input.window, {
                        mode: 'qq',
                        normalizeTest: normalize_test_1.default,
                        waterfall: true,
                        data: {
                            pathArr: ['window']
                        }
                    });
                    return input;
                },
                swan(input) {
                    input.window = (0, run_rules_1.default)(spec.page, input.window, {
                        mode: 'swan',
                        normalizeTest: normalize_test_1.default,
                        waterfall: true,
                        data: {
                            pathArr: ['window']
                        }
                    });
                    return input;
                },
                tt(input) {
                    input.window = (0, run_rules_1.default)(spec.page, input.window, {
                        mode: 'tt',
                        normalizeTest: normalize_test_1.default,
                        waterfall: true,
                        data: {
                            pathArr: ['window']
                        }
                    });
                    return input;
                },
                jd(input) {
                    input.window = (0, run_rules_1.default)(spec.page, input.window, {
                        mode: 'jd',
                        normalizeTest: normalize_test_1.default,
                        waterfall: true,
                        data: {
                            pathArr: ['window']
                        }
                    });
                    return input;
                }
            }
        ]
    };
    return spec;
}
exports.default = getSpec;
//# sourceMappingURL=index.js.map