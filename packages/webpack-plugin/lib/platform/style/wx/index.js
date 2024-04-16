module.exports = function getSpec ({ warn, error }) {
  // rules 思路大致想match template component-config
  // lib/platform/template/wx/component-config/index.js
  const print = ({ platform, tag, type = 'property', isError = false }) => (arg) => {
    if (type === 'tag') {
      error(`<${arg}> is not supported in ${platform} environment!`)
      return
    }
    let msg
    switch (type) {
      // case 'event':
      //   msg = `<${tag}> does not support [bind${arg}] event in ${platform} environment!`
      //   break
      // case 'property':
      //   msg = `<${tag}> does not support [${arg && arg.name}] property in ${platform} environment!`
      //   break
      // case 'value':
      //   msg = `<${tag}>'s property '${arg && arg.name}' does not support '[${arg && arg.value}]' value in ${platform} environment!`
      //   break
      // case 'tagRequiredProps':
      //   msg = `<${tag}> should have '${arg}' attr in ali environment!`
      //   break
      // case 'value-attr-uniform':
      //   msg = `The internal attribute name of the <${tag}>'s attribute '${arg && arg.value}' is not supported in the ali environment, Please check!`
      //   break
      // default:
      //   msg = `<${tag}>'s transform has some error happened!`
    }
    isError ? error(msg) : warn(msg)
  }
  
  const spec = {
    supportedModes: ['react'],
    rules: [
      {
        test: 'text-shadow',
        react ({ prop, value }) { // 仅支持 offset-x | offset-y | blur-radius | color 这种排序
          console.log('css text-shadow', prop, value, 99)
          const newValue = value.split(' ') // Todo 正则匹配 值类型校验
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
      }
      // {
      //   test: 'backgroundColor',
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
