import { DefineConfig } from "."

const TAG_NAME = 'block'

export default <DefineConfig>function () {
  return {
    test: TAG_NAME,
    web () {
      return 'template'
    }
  }
}
