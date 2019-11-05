function setStorage (options = {}) {
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

function setStorageSync (key, data = '') {
  let obj = {}

  if (typeof data === 'symbol') {
    obj = { data: '' }
  } else {
    obj = { data }
  }
  window.localStorage.setItem(key, JSON.stringify(obj))
}

function getStorage (options = {}) {
  const { key, success, fail, complete } = options
  const { result, data } = getItem(key)
  const res = { errMsg: 'getStorage:ok' }
  if (result) {
    res.data = data
    typeof success === 'function' && success(res)
  } else {
    res.errMsg = 'getStorage:fail'
    typeof fail === 'function' && fail(res)
  }
  typeof complete === 'function' && complete(res)
}

function getStorageSync (key) {
  let res = getItem(key)
  if (res.result) return res.data

  return ''
}

function getItem (key) {
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

function getStorageInfo (options = {}) {
  const { success, fail, complete } = options
  let res = { errMsg: 'getStorageInfo:ok' }

  try {
    const info = getStorageInfoSync()

    Object.assign(res, info)
    typeof success === 'function' && success(res)
  } catch (err) {
    res = err
    typeof fail === 'function' && fail(err)
  }

  typeof complete === 'function' && complete(res)
}

function getStorageInfoSync () {
  const res = {}
  res.keys = Object.keys(window.localStorage)
  res.limitSize = null
  res.currentSize = null
  return res
}

function removeStorage (options = {}) {
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

function clearStorage (options = {}) {
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
