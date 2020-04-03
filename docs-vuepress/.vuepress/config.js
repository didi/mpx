const sidebar = {
  '/guide/': [
    {
      title: '基础',
      collapsable: false,
      children: [
        'start',
        'what-is-single-file',
        'template-enhance',
        'script-enhance',
        'style-enhance',
        'json-enhance'
      ]
    },
    {
      title: '进阶',
      collapsable: false,
      children: [
        'store',
        'compilationEnhance',
        'platform',
        'ts',
        'i18n',
        'progressive',
        'understanding',
        'resource'
      ]
    }
  ],
  '/api/': [
    'intro',
    'instance-api'
  ],
  '/extends/': [
    'intro'
  ],
  '/articles/': [
    {
      title: '相关文章',
      collapsable: false,
      children: [
        '1.0',
        '2.0',
        'mpx1'
      ]
    }
  ],
  '/version/': [
    'migrate'
  ]
}

const nav = [
  { text: '指南', link: '/guide/' },
  { text: 'API', link: '/api/intro' },
  { text: '拓展', link: '/extends/intro' },
  { text: '2.0迁移', link: '/version/' },
  { text: '相关文章', link: '/articles/' }
]

module.exports = {
  base: '/mpx/new/',
  head: [
    ['link', { rel: 'icon', href: '/favicon.ico' }]
  ],
  // title: 'MPX',
  themeConfig: {
    logo: '/logo.png',
    sidebar,
    nav,
    displayAllHeaders: true
  }
}
