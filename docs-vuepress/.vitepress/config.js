import { headerPlugin } from './headerMdPlugin'
const sidebar = {
    '/guide/': [
        {
            text: '基础',
            collapsable: false,
            items: [
                'basic/start'
            ]
        }
    ]
}

const nav = [
    { text: '指南', link: '/guide/basic/start' },
    { text: 'API', link: '/api/index' },
    { text: '文章', link: '/articles/index' },
    { text: '更新记录', link: 'https://github.com/didi/mpx/releases', target:'_blank'},
    { text: 'Github', link: 'https://github.com/didi/mpx', target:'_blank'}
]

export default {
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
    title: 'Mpx框架',
    locales: {
        '/': {
            lang: 'zh-CN', // 将会被设置为 <html> 的 lang 属性
            title: 'Mpx框架',
            description: '深度性能优化的增强型小程序开发框架'
        },
    },
    shouldPrefetch: () => false,
    plugins: {
        '@vuepress/pwa': {
            serviceWorker: true,
            updatePopup: {
                message: '文档有更新啦！',
                buttonText: '刷新'
            }
        },
        '@vuepress/active-header-links': {
            sidebarLinkSelector: '.header-anchor',
            headerAnchorSelector: '.header-anchor'
        }
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
        sidebar,
        nav
    },
    chainWebpack: (config, isServer) => {
        // 添加node_modules避免resolve错误
        config.resolve.modules.add('node_modules')
    },
    markdown: {
        // markdown-it-toc 的选项
        extendMarkdown: md => {
            // 使用更多的 markdown-it 插件!
            md.use(headerPlugin)
        }
    }
}
