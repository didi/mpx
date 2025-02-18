import { h } from "vue"
import DefaultTheme from "vitepress/theme"
import HomepageLayout from "./layouts/HomepageLayout.vue"

import "virtual:group-icons.css"
import "./styles/index.css"
import "./styles/switchAppearance.css"

export default {
    ...DefaultTheme,
    Layout() {
        return h(HomepageLayout)
    },
}
