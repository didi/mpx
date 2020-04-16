const sidebar = {
  '/guide/': [
    {
      title: '基础',
      collapsable: false,
      children: [
        'basic/start',
        'basic/intro',
        'basic/single-file',
        'basic/component',
        'basic/template',
        'basic/reactive',
        'basic/class-style-binding',
        'basic/conditional-render',
        'basic/list-render',
        'basic/event',
        'basic/two-way-binding',
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
        'tool/unit-test',
        'tool/webview-bridge'
      ]
    },
    {
      title: '拓展',
      collapsable: false,
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
    'compile',
    'extend'
  ],
  '/articles/': [
    '1.0',
    '2.0'
  ],

}

const nav = [
  { text: '指南', link: '/guide/basic/start' },
  { text: 'API', link: '/api/config' },
  { text: '文章', link: '/articles/1.0' },
  { text: '更新记录', link: 'https://github.com/didi/mpx/releases' },
  { text: 'Github', link: 'https://github.com/didi/mpx' }
]

module.exports = {
  base: '/mpx/new/',
  head: [
    ['link', { rel: 'icon', href: '/favicon.ico' }]
  ],
  themeConfig: {
    sidebarDepth: 1,
    logo: '/logo.png',
    displayAllHeaders: true,
    sidebar,
    nav
  }
}
