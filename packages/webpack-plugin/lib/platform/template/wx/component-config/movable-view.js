const TAG_NAME = 'movable-view'

module.exports = function ({ print }) {
  const aliEventLog = print({ platform: 'ali', tag: TAG_NAME, isError: false, type: 'event' })
  const qaPropLog = print({ platform: 'qa', tag: TAG_NAME, isError: false })
  const ksPropLog = print({ platform: 'ks', tag: TAG_NAME, isError: false })
  const ksEventLog = print({ platform: 'ks', tag: TAG_NAME, isError: false, type: 'event' })

  return {
    test: TAG_NAME,
    web (tag, { el }) {
      el.isBuiltIn = true
      return 'mpx-movable-view'
    },
    android (tag, { el }) {
      el.isBuiltIn = true
      return 'mpx-movable-view'
    },
    harmony (tag, { el }) {
      el.isBuiltIn = true
      return 'mpx-movable-view'
    },
    ios (tag, { el }) {
      el.isBuiltIn = true
      return 'mpx-movable-view'
    },
    props: [
      {
        test: /^(out-of-bounds)$/,
        ali: qaPropLog
      },
      {
        test: /^(inertia)$/,
        ks: ksPropLog
      },
      {
        test: /^(damping|friction)$/,
        ks: ksPropLog
      }
    ],
    event: [
      {
        test: /^(htouchmove|vtouchmove)$/,
        ali: aliEventLog,
        ks: ksEventLog
      }
    ]
  }
}
