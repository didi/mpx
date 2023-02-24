import { DefineConfig } from "."

const TAG_NAME = 'picker-view-column'

export default <DefineConfig>function () {
  return {
    test: TAG_NAME,
    web (tag, { el }) {
      el.isBuiltIn = true
      return 'mpx-picker-view-column'
    }
  }
}
