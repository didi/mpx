// import formatHeaderSlugPlugin from './vuepress-format-header-slug-plugin'
// .vitepress/theme/index.js
// import DefaultTheme from 'vitepress/theme'
import Theme from 'vitepress/theme'
import Layout from './layouts/HomepageLayout.vue'
import { h } from 'vue'
import RegisterSW from "./components/RegisterSW.vue";

export default {
    ...Theme,
    Layout() {
        return h(Theme.Layout, null, {
            'layout-bottom': () => h(RegisterSW)
        })
    }
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
