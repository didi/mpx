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
        'advance/mixin',
        'advance/npm',
        'advance/subpackage',
        'advance/image-process',
        'advance/progressive',
        'advance/ability-compatible',
        'advance/plugin',
        'advance/platform'
      ]
    },
    {
      title: '工具',
      collapsable: false,
      children: [
        'tool/ts',
        'tool/i18n',
        'tool/unit-test'
      ]
    },
    {
      title: '拓展',
      collapsable: false,
      path: '/guide/extend',
      children: [
        'extend/request',
        'extend/mock',
        'extend/api-proxy'
      ]
    },
    {
      title: '理解',
      collapsable: false,
      children: [
        'understand/runtime',
        'understand/compile'
      ]
    }
  ],
  '/api/': [
    'config',
    'global-api',
    'instance-api',
    'directives',
    'compile',
    'builtIn',
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
  ]
}

const nav = [
  { text: '指南', link: '/guide/basic/start' },
  { text: 'API', link: '/api/config' },
  { text: '文章', link: '/articles/index' },
  { text: '更新记录', link: 'https://github.com/didi/mpx/releases' },
  { text: 'Github', link: 'https://github.com/didi/mpx' }
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
    }
  },
  themeConfig: {
    sidebarDepth: 1,
    logo: '/logo.png',
    displayAllHeaders: false,
    sidebar,
    nav
  },
  chainWebpack: (config, isServer) => {
    // 添加node_modules避免resolve错误
    config.resolve.modules.add('node_modules')
  }
}
