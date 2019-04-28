const TAG_NAME = 'video'

module.exports = function ({ print }) {
  /**
   * @type {function(isError: (number|boolean|string)?): void} baiduLog
   * @desc - 无法转换时告知用户的通用方法，接受0个或1个参数，意为是否error级别
   */
  const baiduLog = print('baidu', TAG_NAME)

  return {
    test: TAG_NAME,
    props: [
      {
        test: /^(direction|show-mute-btn|title|play-btn-position|enable-play-gesture|auto-pause-if-navigate|auto-pause-if-open-native|vslide-gesture|vslide-gesture-in-fullscreen)$/,
        swan: baiduLog()
      }
    ],
    event: [
      {
        test: /^(play|progress)$/,
        swan: baiduLog(1)
      }
    ]
  }
}
