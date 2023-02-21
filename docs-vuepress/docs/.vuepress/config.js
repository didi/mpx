const { headerPlugin } = require('./headerMdPlugin')

const sidebar = {
  '/guide/': [
    {
      title: '基础',
      collapsable: false,
      children: [
        'basic/start',
        'basic/intro',
        'basic/single-file',
        'basic/ide',
        'basic/template',
        'basic/css',
        'basic/reactive',
        'basic/class-style-binding',
        'basic/conditional-render',
        'basic/list-render',
        'basic/event',
        'basic/two-way-binding',
        'basic/component',
        'basic/refs'
      ]
    },
    {
      title: '进阶',
      collapsable: false,
      children: [
        'advance/store',
        'advance/pinia',
        'advance/mixin',
        'advance/npm',
        'advance/subpackage',
        'advance/async-subpackage',
        'advance/platform',
        'advance/i18n',
        'advance/size-report',
        'advance/image-process',
        'advance/progressive',
        'advance/ability-compatible',
        'advance/plugin',
        'advance/custom-output-path',
      ]
    },
    {
      title: '组合式 API',
      collapsable: false,
      children: [
        'composition-api/composition-api',
        'composition-api/reactive-api'
      ]
    },
    {
      title: '工具',
      collapsable: false,
      children: [
        'tool/ts',
        'tool/unit-test',
        'tool/e2e-test'
      ]
    },
    {
      title: '拓展',
      collapsable: false,
      path: '/guide/extend',
      children: [
        'extend/fetch',
        'extend/api-proxy',
        'extend/mock'
      ]
    },
    {
      title: '理解',
      collapsable: false,
      children: [
        'understand/runtime',
        'understand/compile'
      ]
    },
    {
      title: '迁移',
      collapsable: false,
      children: [
        'migrate/2.8',
        'migrate/2.7',
        'migrate/mpx-cli-3'
      ]
    }
  ],
  '/api/': [
    'app-config',
    'global-api',
    'instance-api',
    'store-api',
    'directives',
    'compile',
    'builtIn',
    'reactivity-api',
    'composition-api',
    'extend'
  ],
  '/articles/': [
    { title: '滴滴开源小程序框架Mpx', path: '1.0' },
    { title: 'Mpx发布2.0，完美支持跨平台开发', path: '2.0' },
    { title: '小程序框架运行时性能大测评', path: 'performance' },
    { title: 'Mpx框架初体验', path: 'mpx1' },
    { title: 'Mpx框架技术揭秘', path: 'mpx2' },
    { title: '基于Mpx的小程序体积优化', path: 'size-control' },
    { title: 'Mpx中基于 Typescript Template Literal Types 实现链式key的类型推导', path: 'ts-derivation' },
    { title: 'Mpx2.7 版本正式发布，大幅提升编译构建速度', path: '2.7-release' },
    { title: 'Mpx2.8 版本正式发布，使用组合式 API 开发小程序', path: '2.8-release' },
    { title: 'Mpx-cli 插件化改造', path: 'mpx-cli-next' },
    { title: 'Mpx 小程序单元测试能力建设与实践', path: 'unit-test'}
  ]
}

const nav = [
  { text: '指南', link: '/guide/basic/start' },
  { text: 'API', link: '/api/index' },
  { text: '文章', link: '/articles/index' },
  { text: '更新记录', link: 'https://github.com/didi/mpx/releases', target:'_blank'},
  { text: 'Github', link: 'https://github.com/didi/mpx', target:'_blank'}
]

module.exports = {
  base: '/',
  head: [
    ['link', { rel: 'icon', href: '/favicon.ico' }]
  ],
  title: 'Mpx框架',
  locales: {
    '/': {
      lang: 'zh-CN', // 将会被设置为 <html> 的 lang 属性
      title: 'Mpx框架',
      description: '深度性能优化的增强型小程序开发框架'
    },
  },
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
