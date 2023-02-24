import { DefineConfig } from "."

const TAG_NAME = 'slider'

export default <DefineConfig>function ({ print }) {
  const aliPropLog = print({ platform: 'ali', tag: TAG_NAME, isError: false })
  return {
    test: TAG_NAME,
    web (tag, { el }) {
      el.isBuiltIn = true
      return 'mpx-slider'
    },
    props: [
      {
        test: /^color$/,
        ali: aliPropLog
      },
      {
        test: /^(color|selected-color|activeColor|backgroundColor|block-size|block-color)$/,
        ali (obj) {
          const propsMap = {
            color: 'background-color',
            'selected-color': 'active-color',
            activeColor: 'active-color',
            backgroundColor: 'background-color',
            'block-size': 'handle-size',
            'block-color': 'handle-color'
          }
          obj.name = propsMap[obj.name as keyof typeof propsMap]
          return obj
        }
      },
      {
        test: /^(color|selected-color)$/,
        swan (obj) {
          const propsMap = {
            color: 'backgroundColor',
            'selected-color': 'activeColor'
          }
          obj.name = propsMap[obj.name as keyof typeof propsMap]
          return obj
        }
      },
      {
        test: /^(activeColor|backgroundColor)$/,
        tt (obj) {
          const propsMap = {
            activeColor: 'active-color',
            backgroundColor: 'background-color'
          }
          obj.name = propsMap[obj.name as keyof typeof propsMap]
          return obj
        }
      }
    ]
  }
}
