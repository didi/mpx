function setStorage (options: WechatMiniprogram.SetStorageOption) {
  const { key, data, success, fail, complete } = options
  let res = { errMsg: 'setStorage:ok' }
  try {
    setStorageSync(key, data)
    typeof success === 'function' && success(res)
  } catch (err) {
    res = err
    typeof fail === 'function' && fail(err)
  }

  typeof complete === 'function' && complete(res)
}

function setStorageSync (key: string, data: any = '') {
  let obj = {}

  if (typeof data === 'symbol') {
    obj = { data: '' }
  } else {
    obj = { data }
  }
  window.localStorage.setItem(key, JSON.stringify(obj))
}

function getStorage (options: WechatMiniprogram.GetStorageOption) {
  const { key, success, fail, complete } = options
  const { result, data } = getItem(key)
  const res = { errMsg: 'getStorage:ok', data: null }
  if (result) {
    res.data = data
    typeof success === 'function' && success(res)
  } else {
    res.errMsg = 'getStorage:fail'
    typeof fail === 'function' && fail(res)
  }
  typeof complete === 'function' && complete(res)
}

function getStorageSync (key: string) {
  let res = getItem(key)
  if (res.result) return res.data

  return ''
}

function getItem (key: string) {
  let item
  try {
    item = JSON.parse(window.localStorage.getItem(key))
  } catch (e) {}

  if (item && typeof item === 'object' && item.hasOwnProperty('data')) {
    return { result: true, data: item.data }
  } else {
    return { result: false }
  }
}

function getStorageInfo (options: WechatMiniprogram.GetStorageInfoOption) {
  const { success, fail, complete } = options
  let res = null
  try {
    const info = getStorageInfoSync()

    res = Object.assign({}, { errMsg: 'getStorageInfo:ok' }, info)
    typeof success === 'function' && success(res)
  } catch (err) {
    res = err
    typeof fail === 'function' && fail(err)
  }

  typeof complete === 'function' && complete(res)
}

function getStorageInfoSync () {
  return {
    keys: Object.keys(window.localStorage),
    limitSize: null,
    currentSize: null
  }
}

function removeStorage (options: WechatMiniprogram.RemoveStorageOption) {
  const { key, success, fail, complete } = options
  let res = { errMsg: 'removeStorage:ok' }

  try {
    removeStorageSync(key)
    typeof success === 'function' && success(res)
  } catch (err) {
    res = err
    typeof fail === 'function' && fail(err)
  }

  typeof complete === 'function' && complete(res)
}

function removeStorageSync (key) {
  window.localStorage.removeItem(key)
}

function clearStorage (options: WechatMiniprogram.ClearStorageOption) {
  const { success, fail, complete } = options
  let res = { errMsg: 'clearStorage:ok' }
  try {
    clearStorageSync()
    typeof success === 'function' && success(res)
  } catch (err) {
    res = err
    typeof fail === 'function' && fail(err)
  }

  typeof complete === 'function' && complete(res)
}

function clearStorageSync () {
  window.localStorage.clear()
}

export {
  setStorage,
  setStorageSync,
  getStorage,
  getStorageSync,
  getStorageInfo,
  getStorageInfoSync,
  removeStorage,
  removeStorageSync,
  clearStorage,
  clearStorageSync
}
