import { DefineConfig } from '.'

const TAG_NAME = 'cover-image'

export default <DefineConfig> function ({ print }) {
  const aliEventLog = print({ platform: 'ali', tag: TAG_NAME, isError: false, type: 'event' })
  return {
    test: TAG_NAME,
    web (_tag, { el }) {
      el.isBuiltIn = true
      return 'mpx-image'
    },
    tt () {
      return 'image'
    },
    props: [
      {
        test: 'use-built-in',
        web (_prop, { el }) {
          el.isBuiltIn = true
        }
      }
    ],
    event: [
      {
        test: /^(load|error)$/,
        ali: aliEventLog
      }
    ]
  }
}
