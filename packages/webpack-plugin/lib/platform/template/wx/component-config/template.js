const TAG_NAME = 'template'

module.exports = function ({ moduleId }) {
  return {
    test: TAG_NAME,
    web(tag, { el }) {
      if (el.attrsMap[':is']) {
        return 'component'
      }
    },
    props: [
      {
        test: 'data',
        swan ({ name, value }) {
          return {
            name,
            value: `{${value}}`
          }
        },
        web({ value }) {
          let bindValue = value
          if (moduleId) {
            const lastIndex = value.lastIndexOf('}}')
            bindValue = value ? value.slice(0, lastIndex) + `, _data_v_id: '${moduleId}'}}` : `{{ _data_v_id: '${moduleId}' }}`
          }
          return {
            name: 'v-bind',
            value: bindValue
          }
        }
      },
      {
        test: 'is',
        web({ value }) {
          return {
            name: ':is',
            value: `'${value}'`
          }
        }
      }
    ]
  }
}
