const TAG_NAME = 'slider'

module.exports = function ({ print }) {
  const aliPropLog = print({ platform: 'ali', tag: TAG_NAME, isError: false })
  return {
    test: TAG_NAME,
    props: [
      {
        test: /^color$/,
        ali: aliPropLog
      },
      {
        test: /^(color|selected-color|activeColor|backgroundColor|block-size|block-color)$/,
        ali (obj) {
          const propsMap = {
            'color': 'background-color',
            'selected-color': 'active-color',
            'activeColor': 'active-color',
            'backgroundColor': 'background-color',
            'block-size': 'handle-size',
            'block-color': 'handle-color'
          }
          obj.name = propsMap[obj.name]
          return obj
        }
      }
    ],
    event: [
      {
        test: /^(change)$/,
        ali (eventName) {
          const eventMap = {
            'change': 'change',
            'changing': 'changing'
          }
          return eventMap[eventName]
        }
      }
    ]
  }
}
