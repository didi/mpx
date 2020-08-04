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
      path:'/guide/extend',
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
    '1.0',
    '2.0',
    'mpx1'
  ]
}

const nav = [
  { text: '指南', link: '/guide/basic/start' },
  { text: 'API', link: '/api/config' },
  { text: '文章', link: '/articles/1.0' },
  { text: '更新记录', link: 'https://github.com/didi/mpx/releases' },
  { text: 'Github', link: 'https://github.com/didi/mpx' }
]

module.exports = {
  base: '/mpx/',
  head: [
    ['link', { rel: 'icon', href: '/favicon.ico' }]
  ],
  themeConfig: {
    sidebarDepth: 1,
    logo: '/logo.png',
    displayAllHeaders: false,
    sidebar,
    nav
  }
}
