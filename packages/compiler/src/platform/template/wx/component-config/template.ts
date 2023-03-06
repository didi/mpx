import { DefineConfig } from '.'

const TAG_NAME = 'template'

export default <DefineConfig> function () {
  return {
    test: TAG_NAME,
    props: [
      {
        test: 'data',
        swan ({ name, value }) {
          return {
            name,
            value: `{${value}}`
          }
        }
      }
    ]
  }
}
