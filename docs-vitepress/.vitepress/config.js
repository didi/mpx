import { defineConfig } from 'vitepress'
import { withPwa } from '@vite-pwa/vitepress'

const sidebar = {
    onThisPage: 'contents',
    '/guide/': [
        {
            text: '基础',
            collapsable: false,
            items: [
                { text: '快速开始', link: '/guide/basic/start' },
                { text: '介绍', link: '/guide/basic/intro' },
                { text: '单文件开发', link: '/guide/basic/single-file' },
                { text: 'IDE 高亮配置', link: '/guide/basic/ide' },
                { text: '模板语法', link: '/guide/basic/template' },
                { text: 'CSS 处理', link: '/guide/basic/css' },
                { text: '数据响应', link: '/guide/basic/reactive' },
                { text: '类名样式绑定', link: '/guide/basic/class-style-binding' },
                { text: '条件渲染', link: '/guide/basic/conditional-render' },
                { text: '列表渲染', link: '/guide/basic/list-render' },
                { text: '事件处理', link: '/guide/basic/event' },
                { text: '双向绑定', link: '/guide/basic/two-way-binding' },
                { text: '自定义组件', link: '/guide/basic/component' },
                { text: '获取组件实例/节点信息', link: '/guide/basic/refs' },
                { text: '模版内可选链表达式', link: '/guide/basic/option-chain' }
            ]
        },
        {
            text: '进阶',
            collapsable: false,
            items: [
                { text: '状态管理（store）', link: '/guide/advance/store' },
                { text: '状态管理（pinia）', link: '/guide/advance/pinia' },
                { text: '使用 mixin', link: '/guide/advance/mixin' },
                { text: '使用npm', link: '/guide/advance/npm' },
                { text: '使用分包', link: '/guide/advance/subpackage' },
                { text: '分包异步化', link: '/guide/advance/async-subpackage' },
                { text: '跨平台', link: '/guide/advance/platform' },
                { text: '国际化i18n', link: '/guide/advance/i18n' },
                { text: '包体积分析', link: '/guide/advance/size-report' },
                { text: '图像资源处理', link: '/guide/advance/image-process' },
                { text: '原生渐进迁移', link: '/guide/advance/progressive' },
                { text: '原生能力兼容', link: '/guide/advance/ability-compatible' },
                { text: '小程序插件', link: '/guide/advance/plugin' },
                { text: '自定义路径', link: '/guide/advance/custom-output-path' },
                { text: '使用原子类', link: '/guide/advance/utility-first-css' },
                { text: 'SSR', link: '/guide/advance/ssr' },
                { text: '依赖注入（Provide/Inject）', link: '/guide/advance/provide-inject' },
                { text: '编译配置', link: '/guide/advance/build-config' }
            ]
        },
        {
            text: '跨端',
            collapsable: false,
            items: [
                { text: '跨端输出基础', link: '/guide/platform/basic' },
                { text: '跨端输出RN', link: '/guide/platform/rn' },
            ]
        },
        {
            text: '组合式 API',
            collapsable: false,
            items: [
                { text: '组合式 API', link: '/guide/composition-api/composition-api' },
                { text: '响应式 API', link: '/guide/composition-api/reactive-api' }
            ]
        },
        {
            text: '工具',
            collapsable: false,
            items: [
                { text: '使用TypeScript开发小程序', link: '/guide/tool/ts' },
                { text: '单元测试', link: '/guide/tool/unit-test' },
                { text: 'E2E自动化测试', link: '/guide/tool/e2e-test' }
            ]
        },
        {
            text: '拓展',
            collapsable: false,
            items: [
                { text: '网络请求', link: '/guide/extend/fetch' },
                { text: 'API 转换', link: '/guide/extend/api-proxy' },
                { text: '数据 Mock', link: '/guide/extend/mock' }
            ]
        },
        {
            text: '理解',
            collapsable: false,
            items: [
                { text: 'Mpx运行时增强原理', link: '/guide/understand/runtime' },
                { text: 'Mpx编译构建原理', link: '/guide/understand/compile' }
            ]
        },
        {
            text: '迁移',
            collapsable: false,
            items: [
                { text: '从 2.8 升级至 2.9', link: '/guide/migrate/2.9' },
                { text: '从 2.7 升级至 2.8', link: '/guide/migrate/2.8' },
                { text: '从旧版本迁移至 2.7', link: '/guide/migrate/2.7' },
                { text: 'mpx-cli v2 迁移到 v3', link: '/guide/migrate/mpx-cli-3' },
            ]
        }
    ],
    '/api/': [
        {
            text: 'API',
            collapsable: false,
            items: [
                { text: '全局配置', link: '/api/app-config' },
                { text: '全局 API', link: '/api/global-api' },
                { text: '实例 API', link: '/api/instance-api' },
                { text: 'Store API', link: '/api/store-api' },
                { text: '模板指令', link: '/api/directives' },
                { text: '编译构建', link: '/api/compile' },
                { text: '内建组件', link: '/api/builtIn' },
                { text: '响应式 API', link: '/api/reactivity-api' },
                { text: '组合式 API', link: '/api/composition-api' },
                { text: '选项式 API', link: '/api/optional-api' },
                { text: '周边拓展', link: '/api/extend' },
            ]
        }
    ],
    '/articles/': [
        {
            text: '文章',
            collapsable: false,
            items: [
                { text: '滴滴开源小程序框架Mpx', link: '/articles/1.0' },
                { text: 'Mpx发布2.0，完美支持跨平台开发', link: '/articles/2.0' },
                { text: '小程序框架运行时性能大测评', link: '/articles/performance' },
                { text: '小程序开发者，为什么你应该尝试下MPX', link: '/articles/mpx1' },
                { text: 'Mpx 小程序框架技术揭秘', link: '/articles/mpx2' },
                { text: '滴滴出行小程序体积优化实践', link: '/articles/size-control' },
                { text: '使用Typescript新特性Template Literal Types完善链式key的类型推导', link: '/articles/ts-derivation' },
                { text: 'Mpx2.7 版本正式发布，大幅提升编译构建速度', link: '/articles/2.7-release' },
                { text: 'Mpx2.8 版本正式发布，使用组合式 API 开发小程序', link: '/articles/2.8-release' },
                { text: 'Mpx2.9 版本正式发布，支持原子类、SSR 和包体积优化', link: '/articles/2.9-release' },
                { text: '小程序跨端组件库 Mpx-cube-ui 开源啦', link: '/articles/mpx-cube-ui' },
                { text: '@mpxjs/cli 插件化改造', link: '/articles/mpx-cli-next' },
                { text: 'Mpx 小程序单元测试能力建设与实践', link: '/articles/unit-test' },
            ]
        }
    ]
}

const title = 'Mpx框架'
const description = '深度性能优化的增强型小程序开发框架'

export default withPwa(defineConfig({
    base: '/',
    head: [
        ['link', { rel: 'icon', href: '/favicon.ico' }],
        // 插入一段 clarity 的数据分析的代码
        ['script', { type: 'text/javascript' }, `(function(c,l,a,r,i,t,y){
        c[a]=c[a]||function(){(c[a].q=c[a].q||[]).push(arguments)};
        t=l.createElement(r);t.async=1;t.src="https://www.clarity.ms/tag/"+i;
        y=l.getElementsByTagName(r)[0];y.parentNode.insertBefore(t,y);
    })(window, document, "clarity", "script", "jtvvy52wxy");`]
    ],
    title,
    locales: {
        // 如果有其他语言，也可以在这里添加
        // '/zh/': {
        //   prev: '上一页',
        // },
        '/': {
            lang: 'zh-CN', // 将会被设置为 <html> 的 lang 属性
            title,
            description,
            prev: '上一页',
        },
    },
    ignoreDeadLinks: true,
    pwa: {
        base: '/',
        scope: '/',
        includeAssets: ['favicon.svg'],
        manifest: {
            name: title,
            short_name: 'Mpx',
            description,
            theme_color: '#ffffff',
            // icons: [
            //     {
            //         src: 'pwa-192x192.png',
            //         sizes: '192x192',
            //         type: 'image/png',
            //     },
            //     {
            //         src: 'pwa-512x512.png',
            //         sizes: '512x512',
            //         type: 'image/png',
            //     },
            //     {
            //         src: 'pwa-512x512.png',
            //         sizes: '512x512',
            //         type: 'image/png',
            //         purpose: 'any maskable',
            //     },
            // ],
        },
        workbox: {
            globPatterns: ['**/*.{css,js,html,svg,png,ico,txt,woff2}'],
        },
        devOptions: {
            enabled: true,
            suppressWarnings: true,
            navigateFallback: '/',
        },
    },
    themeConfig: {
        // navbar: false,
        algolia: {
            apiKey: '7849f511f78afc4383a81f0137a91c0f',
            indexName: 'mpxjs',
        },
        sidebarDepth: 1,
        logo: '/logo.png',
        displayAllHeaders: false,
        sidebar
    },
    chainWebpack: (config, isServer) => {
        // 添加node_modules避免resolve错误
        config.resolve.modules.add('node_modules')
    }
})
)
