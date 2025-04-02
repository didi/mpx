import { h } from "vue"
import DefaultTheme from "vitepress/theme"
import TwoslashFloatingVue from "@shikijs/vitepress-twoslash/client"
import HomepageLayout from "./layouts/HomepageLayout.vue"

import '@shikijs/vitepress-twoslash/style.css'
import "virtual:group-icons.css"
import "./styles/index.css"
import "./styles/switchAppearance.css"

export default {
    ...DefaultTheme,
    Layout() {
        return h(HomepageLayout)
    },
    enhanceApp({ app }) {
        app.use(TwoslashFloatingVue)
    },
}
