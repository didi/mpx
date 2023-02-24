import { DefineConfig } from "."

const TAG_NAME = 'movable-area'

export default <DefineConfig>function ({ print }) {
  return {
    test: TAG_NAME,
    web (tag, { el }) {
      el.isBuiltIn = true
      return 'mpx-movable-area'
    }
  }
}
