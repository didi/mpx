import { defineConfig } from "vitepress"
import { withPwa } from "@vite-pwa/vitepress"

const sidebar = {
    "/guide/": [
        {
            text: "基础",
            collapsable: false,
            items: [
                { text: "快速开始", link: "/guide/basic/start" },
                { text: "介绍", link: "/guide/basic/intro" },
                { text: "单文件开发", link: "/guide/basic/single-file" },
                { text: "IDE 高亮配置", link: "/guide/basic/ide" },
                { text: "模板语法", link: "/guide/basic/template" },
                { text: "CSS 处理", link: "/guide/basic/css" },
                { text: "数据响应", link: "/guide/basic/reactive" },
                {
                    text: "类名样式绑定",
                    link: "/guide/basic/class-style-binding",
                },
                { text: "条件渲染", link: "/guide/basic/conditional-render" },
                { text: "列表渲染", link: "/guide/basic/list-render" },
                { text: "事件处理", link: "/guide/basic/event" },
                { text: "双向绑定", link: "/guide/basic/two-way-binding" },
                { text: "自定义组件", link: "/guide/basic/component" },
                { text: "获取组件实例/节点信息", link: "/guide/basic/refs" },
                {
                    text: "模版内可选链表达式",
                    link: "/guide/basic/option-chain",
                },
            ],
        },
        {
            text: "进阶",
            collapsable: false,
            items: [
                { text: "状态管理（store）", link: "/guide/advance/store" },
                { text: "状态管理（pinia）", link: "/guide/advance/pinia" },
                { text: "使用 mixin", link: "/guide/advance/mixin" },
                { text: "使用 npm", link: "/guide/advance/npm" },
                { text: "使用分包", link: "/guide/advance/subpackage" },
                { text: "分包异步化", link: "/guide/advance/async-subpackage" },
                { text: "跨平台", link: "/guide/advance/platform" },
                { text: "国际化 i18n", link: "/guide/advance/i18n" },
                { text: "包体积分析", link: "/guide/advance/size-report" },
                { text: "图像资源处理", link: "/guide/advance/image-process" },
                { text: "原生渐进迁移", link: "/guide/advance/progressive" },
                {
                    text: "原生能力兼容",
                    link: "/guide/advance/ability-compatible",
                },
                { text: "小程序插件", link: "/guide/advance/plugin" },
                {
                    text: "自定义路径",
                    link: "/guide/advance/custom-output-path",
                },
                {
                    text: "使用原子类",
                    link: "/guide/advance/utility-first-css",
                },
                { text: "SSR", link: "/guide/advance/ssr" },
                {
                    text: "依赖注入（Provide/Inject）",
                    link: "/guide/advance/provide-inject",
                },
                { text: "编译配置", link: "/guide/advance/build-config" },
            ],
        },
        {
            text: "跨端",
            collapsable: false,
            items: [
                { text: "跨端输出基础", link: "/guide/platform/basic" },
                { text: "跨端输出 RN", link: "/guide/platform/rn" },
            ],
        },
        {
            text: "组合式 API",
            collapsable: false,
            items: [
                {
                    text: "组合式 API",
                    link: "/guide/composition-api/composition-api",
                },
                {
                    text: "响应式 API",
                    link: "/guide/composition-api/reactive-api",
                },
            ],
        },
        {
            text: "工具",
            collapsable: false,
            items: [
                { text: "使用TypeScript开发小程序", link: "/guide/tool/ts" },
                { text: "单元测试", link: "/guide/tool/unit-test" },
                { text: "E2E自动化测试", link: "/guide/tool/e2e-test" },
            ],
        },
        {
            text: "拓展",
            collapsable: false,
            items: [
                { text: "网络请求", link: "/guide/extend/fetch" },
                { text: "API 转换", link: "/guide/extend/api-proxy" },
                { text: "数据 Mock", link: "/guide/extend/mock" },
            ],
        },
        {
            text: "理解",
            collapsable: false,
            items: [
                {
                    text: "Mpx运行时增强原理",
                    link: "/guide/understand/runtime",
                },
                { text: "Mpx编译构建原理", link: "/guide/understand/compile" },
            ],
        },
        {
            text: "迁移",
            collapsable: false,
            items: [
                { text: "从 2.8 升级至 2.9", link: "/guide/migrate/2.9" },
                { text: "从 2.7 升级至 2.8", link: "/guide/migrate/2.8" },
                { text: "从旧版本迁移至 2.7", link: "/guide/migrate/2.7" },
                {
                    text: "mpx-cli v2 迁移到 v3",
                    link: "/guide/migrate/mpx-cli-3",
                },
            ],
        },
    ],
    "/api/": [
        {
            text: "API",
            collapsable: false,
            items: [
                { text: "API 参考", link: "/api/" },
                { text: "全局配置", link: "/api/app-config" },
                { text: "全局 API", link: "/api/global-api" },
                { text: "实例 API", link: "/api/instance-api" },
                { text: "Store API", link: "/api/store-api" },
                { text: "模板指令", link: "/api/directives" },
                { text: "编译构建", link: "/api/compile" },
                { text: "内建组件", link: "/api/builtIn" },
                { text: "响应式 API", link: "/api/reactivity-api" },
                { text: "组合式 API", link: "/api/composition-api" },
                { text: "选项式 API", link: "/api/optional-api" },
                { text: "周边拓展", link: "/api/extend" },
            ],
        },
    ],
    "/articles/": [
        {
            text: "文章",
            collapsable: false,
            items: [
                { text: "滴滴开源小程序框架Mpx", link: "/articles/1.0" },
                {
                    text: "Mpx 发布2.0，完美支持跨平台开发",
                    link: "/articles/2.0",
                },
                {
                    text: "小程序框架运行时性能大测评",
                    link: "/articles/performance",
                },
                {
                    text: "小程序开发者，为什么你应该尝试下MPX",
                    link: "/articles/mpx1",
                },
                { text: "Mpx 小程序框架技术揭秘", link: "/articles/mpx2" },
                {
                    text: "滴滴出行小程序体积优化实践",
                    link: "/articles/size-control",
                },
                {
                    text: "使用Typescript新特性Template Literal Types完善链式key的类型推导",
                    link: "/articles/ts-derivation",
                },
                {
                    text: "Mpx2.7 版本正式发布，大幅提升编译构建速度",
                    link: "/articles/2.7-release",
                },
                {
                    text: "Mpx2.8 版本正式发布，使用组合式 API 开发小程序",
                    link: "/articles/2.8-release",
                },
                {
                    text: "Mpx2.9 版本正式发布，支持原子类、SSR 和包体积优化",
                    link: "/articles/2.9-release",
                },
                {
                    text: "小程序跨端组件库 Mpx-cube-ui 开源啦",
                    link: "/articles/mpx-cube-ui",
                },
                {
                    text: "@mpxjs/cli 插件化改造",
                    link: "/articles/mpx-cli-next",
                },
                {
                    text: "Mpx 小程序单元测试能力建设与实践",
                    link: "/articles/unit-test",
                },
            ],
        },
    ],
}

const algoliaTranslations = {
    button: {
        buttonText: "搜索",
    },
    modal: {
        searchBox: {
            resetButtonTitle: "清除查询条件",
            resetButtonAriaLabel: "清除查询条件",
            cancelButtonText: "取消",
            cancelButtonAriaLabel: "取消",
        },
        startScreen: {
            recentSearchesTitle: "搜索历史",
            noRecentSearchesText: "没有搜索历史",
            saveRecentSearchButtonTitle: "保存到搜索历史",
            removeRecentSearchButtonTitle: "从搜索历史中移除",
            favoriteSearchesTitle: "收藏",
            removeFavoriteSearchButtonTitle: "从收藏中移除",
        },
        errorScreen: {
            titleText: "无法获取结果",
            helpText: "你可能需要检查你的网络连接",
        },
        footer: {
            selectText: "选择",
            navigateText: "切换",
            closeText: "关闭",
            searchByText: "搜索供应商",
        },
        noResultsScreen: {
            noResultsText: "无法找到相关结果",
            suggestedQueryText: "你可以尝试查询",
            reportMissingResultsText: "你认为这个查询应该有结果？",
            reportMissingResultsLinkText: "向我们反馈",
        },
    },
}

const i18n = {
    search: '搜索',
    menu: '菜单',
    toc: '本页目录',
    returnToTop: '返回顶部',
    appearance: '外观',
    previous: '前一篇',
    next: '下一篇',
    pageNotFound: '页面未找到',
}

const ogUrl = "https://mpxjs.cn/"
const ogImage = `${ogUrl}logo.png`
const title = "Mpx 框架"
const description = "深度性能优化的增强型小程序开发框架"

export default withPwa(
    defineConfig({
        base: "/",
        head: [
            ["link", { rel: "icon", href: "/favicon.ico" }],
            [
                "script",
                { type: "text/javascript" },
                `(function(c,l,a,r,i,t,y){
                c[a]=c[a]||function(){(c[a].q=c[a].q||[]).push(arguments)};
                t=l.createElement(r);t.async=1;t.src="https://www.clarity.ms/tag/"+i;
                y=l.getElementsByTagName(r)[0];y.parentNode.insertBefore(t,y);
            })(window, document, "clarity", "script", "jtvvy52wxy");`,
            ],
            ["meta", { name: "author", content: title }],
            ["meta", { property: "og:type", content: "website" }],
            ["meta", { name: "og:title", content: title }],
            ["meta", { name: "og:description", content: description }],
            ["meta", { property: "og:image", content: ogImage }],
            ["meta", { property: "og:url", content: ogUrl }],
        ],
        title,
        locales: {
            // 如果有其他语言，也可以在这里添加
            // '/zh/': {
            //   prev: '上一页',
            // },
            "/": {
                label: "中文",
                lang: "zh-CN", // 将会被设置为 <html> 的 lang 属性
                title,
                description,
            },
        },
        ignoreDeadLinks: true,
        pwa: {
            base: "/",
            scope: "/",
            includeAssets: ["favicon.ico", "logo.png"],
            manifest: {
                name: title,
                short_name: "Mpx",
                description,
                theme_color: "#ffffff",
            },
            workbox: {
                globPatterns: ["**/*.{css,js,html,svg,png,ico,txt,woff2}"],
            },
            devOptions: {
                enabled: false,
                suppressWarnings: true,
                navigateFallback: "/",
            },
        },
        themeConfig: {
            // navbar: false,
            algolia: {
                // apiKey: '7849f511f78afc4383a81f0137a91c0f',
                appId: "DZ8S6HN0MP",
                apiKey: "a34809e24ae1eb13ca3afc255d0a0cef",
                indexName: "mpxjs",
                placeholder: "搜索文档",
                translations: algoliaTranslations,
            },
            logo: "/favicon.ico",
            socialLinks: [
                { icon: "github", link: "https://github.com/didi/mpx" },
            ],
            nav: [
                {
                    text: "指南",
                    activeMatch: "^/guide/",
                    link: "/guide/basic/start",
                },
                // 未来热门的链接可以用下面的折叠标题
                // {
                //     text: "文档",
                //     activeMatch: "^/guide/(basic/start|platform/basic)/",
                //     items: [
                //         { text: "快速开始", link: "/guide/basic/start" },
                //         { text: "跨端输出", link: "/guide/platform/basic" },
                //     ],
                // },
                { text: "API", activeMatch: "^/api/", link: "/api/" },
                {
                    text: "文章",
                    activeMatch: "^/articles/",
                    link: "/articles/",
                },
                {
                    text: "更新记录",
                    activeMatch: "^/releases/",
                    link: "https://github.com/didi/mpx/releases",
                    target: "_blank",
                },
            ],
            outline: {
                level: [2, 3],
                label: "本页目录",
            },
            sidebar,
            darkModeSwitchLabel: "外观",
            sidebarMenuLabel: "菜单",
            returnToTopLabel: "返回顶部",
            langMenuLabel: "语言",
            notFound: {
                title: "页面未找到",
                linkText: "返回首页",
                quote: "😩 抱歉，迷路了～"
            },
            docFooter: {
                prev: "上一页",
                next: "下一页",
            },
        },
        // @ts-ignore
        chainWebpack: (config) => {
            // 添加node_modules避免resolve错误
            config.resolve.modules.add("node_modules")
        },
    })
)
