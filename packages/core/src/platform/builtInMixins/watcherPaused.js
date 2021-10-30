function setPausedWatch (target, isHide) {
  if (!target.$rawOptions.mpxConfig || !target.$rawOptions.mpxConfig.isPausedOnHide) return
  const watchers = target.$getWatchers()
  if (watchers && watchers.length) {
    for (let i = 0; i < watchers.length; i++) {
      const watcher = watchers[i]
      isHide && watcher.pause()
      !isHide && watcher.resume()
    }
  }
}

export default function watchPausedMixins (mixinType) {
  const show = mixinType === 'component' ? 'pageShow' : 'onShow'
  const hide = mixinType === 'component' ? 'pageHide' : 'onHide'
  return {
    data: {
      _first: true
    },
    [show] () {
      // show 取消暂停状态
      if (!this._first) setPausedWatch(this, false)
      this._first = false
    },
    [hide] () {
      // hide 设置暂停状态
      setPausedWatch(this, true)
    }
  }
}
