// import formatHeaderSlugPlugin from './vuepress-format-header-slug-plugin'
// .vitepress/theme/index.js
import DefaultTheme from 'vitepress/theme'
import Layout from './layouts/HomepageLayout.vue'

export default {
    extends: DefaultTheme,
    Layout
}
// export default {
//   extend: '@vuepress/theme-default',
//   plugins: [
//     ['@vuepress/search', {
//       searchMaxSuggestions: 10
//     }],
//     ['@vuepress/back-to-top'],
//     formatHeaderSlugPlugin
//   ]
// }
