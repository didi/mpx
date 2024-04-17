const unsupported = require('./unsupported')

module.exports = function getSpec ({ warn, error }) {

  const print = ({ platform, type = 'prop', isError = true, unsupportedMap = {} }) => ({ prop, value }) => {
    let content = ''
    if (type === 'prop') { // css pro 不支持
      content = `CSS property ${prop} is not supported in ${platform} environment!`
    } else if (type === 'value' && unsupportedMap[prop]?.includes(value)) { // css value 不支持
      content = `CSS property ${prop} does not support [${value}] value in ${platform} environment!`
    }
    isError ? error({ prop, content }) : warn({ prop, content })
  }
  
  const spec = {
    supportedModes: ['react'],
    rules: [
      // unsupportedProps()
      ...unsupported({ print }),
      {
        test: 'text-shadow',
        react ({ prop, value }) { // 仅支持 offset-x | offset-y | blur-radius | color 这种排序
          console.log('css text-shadow', prop, value, 99)
          const newValue = value.split(' ')
          const newProp = ['textShadowOffset','textShadowRadius','textShadowColor']
          return [
            {
              prop: newProp[0],
              value: {
                width: newValue[0],
                height: newValue[1],
              }
            },
            {
              prop: newProp[1],
              value: newValue[2],
            },
            {
              prop: newProp[2],
              value: newValue[3],
            }
          ]
        }
      },
      // {
      //   test: 'pointer-events',
      //   react ({ prop, value }) {
      //     console.log('cdd background-color', prop, value, 999)
      //     return {
      //       prop,
      //       value: '#000'
      //     }
      //   }
      // },
    ]
  }
  return spec
}
