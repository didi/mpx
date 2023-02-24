import { DefineConfig } from "."

const TAG_NAME = 'web-view'

export default <DefineConfig>function () {
  return {
    test: TAG_NAME,
    web (tag, { el }) {
      el.isBuiltIn = true
      return 'mpx-web-view'
    }
  }
}
