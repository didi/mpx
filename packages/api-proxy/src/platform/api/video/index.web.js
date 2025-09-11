import { isBrowser, throwSSRWarning, warn } from '../../../common/js'

const allowPlaybackRate = [0.5, 0.8, 1.0, 1.25, 1.5, 2.0]
export const createVideoContext = (id, context) => {
  if (!isBrowser) {
    throwSSRWarning('createVideoContext API is running in non browser environments')
    return
  }
  if (!id) {
    throw new Error('id为必传参数')
  }
  let __videoNode
  if (context && context.$el) {
    __videoNode = context.$el.querySelector(`#${id}`)
  } else {
    __videoNode = document.querySelector(`#${id}`)
  }
  if (!__videoNode) {
    throw new Error(`未找到id为${id}的节点`)
  }
  const __videoContext = {}

  // todo 进入后台音频播放模式
  __videoContext.requestBackgroundPlayback = () => {
    warn('暂不支持requestBackgroundPlayback API')
  }

  // todo 退出后台音频播放
  __videoContext.exitBackgroundPlayback = () => {
    warn('暂不支持exitBackgroundPlayback API')
  }

  // todo 退出小窗，该方法可在任意页面调用
  __videoContext.exitPictureInPicture = ({ success, fail, complete }) => {
    warn('暂不支持exitPictureInPicture API')
  }

  // todo 发送弹幕
  __videoContext.sendDanmu = ({ text, color }) => {
    warn('暂不支持发送弹幕')
  }

  // 进入全屏
  __videoContext.requestFullScreen = ({ direction }) => {
    __videoNode.webkitRequestFullScreen && __videoNode.webkitRequestFullScreen() // Chrome
    __videoNode.mozRequestFullScreen && __videoNode.mozRequestFullScreen() // Firefox
    __videoNode.msRequestFullscreen && __videoNode.msRequestFullscreen() // IE
    __videoNode.oRequestFullScreen && __videoNode.oRequestFullScreen() // 欧朋
    __videoNode.webkitEnterFullscreen && __videoNode.webkitEnterFullscreen() // 苹果
    if (direction === 0) {
      __videoNode.__vue__._player.setAttribute('x5-video-orientation', 'portraint') // portraint 竖屏 landscape 横屏
    } else if (direction === 90 || direction === -90) {
      __videoNode.__vue__._player.setAttribute('x5-video-orientation', 'landscape') // portraint 竖屏 landscape 横屏
    }
  }

  // 退出全屏
  __videoContext.exitFullScreen = () => {
    document.webkitCancelFullScreen && document.webkitCancelFullScreen() // Chrome
    document.mozCancelFullScreen && document.mozCancelFullScreen() // Firefox
    document.exitFullscreen && document.exitFullscreen() // W3C
  }

  // 显示状态栏
  __videoContext.showStatusBar = () => {
    __videoNode.__vue__._player.setAttribute('controls', 'controls')
  }

  // 隐藏状态栏
  __videoContext.hideStatusBar = () => {
    __videoNode.__vue__._player.removeAttribute('controls')
  }

  // 暂停
  __videoContext.pause = () => {
    // __videoNode.pause()
    __videoNode.__vue__._player.pause()
  }

  // 播放
  __videoContext.play = () => {
    __videoNode.__vue__._player.play()
  }

  // 停止视频
  __videoContext.stop = () => {
    __videoNode.currentTime = 0
    __videoNode.__vue__._player.pause()
  }

  // 设置倍速播放
  __videoContext.playbackRate = (number) => {
    if (allowPlaybackRate.indexOf(number) === -1) {
      warn(`不支持${number}倍速播放`)
      return
    }
    __videoNode.__vue__._player.playbackRate = number
  }

  // 跳转到指定位置
  __videoContext.seek = (number) => {
    __videoNode.__vue__._player.currentTime = number
  }

  return __videoContext
}
