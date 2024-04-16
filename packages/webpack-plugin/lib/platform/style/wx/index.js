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
    rules: [ // Todo test
      // 思路大致想match template component-config
      // 这里 rpx & 驼峰处理 是不是可以都收到 rules 内
      // 然后检测不支持的 prop & value
      // 最后是支持的属性的转换规则
      {
        test: 'textShadow',
        react ({ prop, value }) {
          console.log('css text-shadow', prop, value, 99)
          return {
            prop: 'paddingBottom',
            value: 10
          }
        }
      },
      {
        test: 'backgroundColor',
        react ({ prop, value }) {
          console.log('cdd background-color', prop, value, 999)
          return {
            prop,
            value: '#000'
          }
        }
      },
    ]
  }
  return spec
}
