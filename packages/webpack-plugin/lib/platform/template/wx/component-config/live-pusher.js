const TAG_NAME = 'live-pusher'

module.exports = function ({ print }) {
  const qqPropLog = print({ platform: 'qq', tag: TAG_NAME, isError: false })
  const qqEventLog = print({ platform: 'qq', tag: TAG_NAME, isError: false, type: 'event' })
  return {
    test: TAG_NAME,
    props: [
      {
        test: /^(remote-mirror|local-mirror|audio-reverb-type|enable-mic|enable-agc|enable-ans|audio-volume-type|video-width|video-height|beauty-style|filter)$/,
        qq: qqPropLog
      }
    ],
    event: [
      {
        test: /^(audiovolumenotify)$/,
        qq: qqEventLog
      }
    ]
  }
}
