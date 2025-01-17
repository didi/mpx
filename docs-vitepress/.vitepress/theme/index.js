import { h } from 'vue'
import DefaultTheme from 'vitepress/theme'
import Layout from './layouts/HomepageLayout.vue'
import RegisterSW from "./components/RegisterSW.vue"
import './styles/index.css'

export default {
    ...DefaultTheme,
    Layout() {
        return h(Layout, null, {
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
