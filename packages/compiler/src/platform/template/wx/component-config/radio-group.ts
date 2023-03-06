import { DefineConfig } from '.'

const TAG_NAME = 'radio-group'

export default <DefineConfig> function () {
  return {
    test: TAG_NAME,
    web (_tag, { el }) {
      el.isBuiltIn = true
      return 'mpx-radio-group'
    }
  }
}
