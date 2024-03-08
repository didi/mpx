function setStorage (options) {
  my.setStorage(options)
}

function setStorageSync (key, data) {
  my.setStorageSync({
    key,
    data
  })
}

function getStorage (options) {
  my.getStorage(options)
}

function getStorageSync (key) {
  return my.getStorageSync({
    key
  }).data
}

function getStorageInfo (options) {
  return my.getStorageInfo(options)
}

function getStorageInfoSync () {
  return my.getStorageInfoSync()
}

function removeStorage (options) {
  return my.removeStorage(options)
}

function removeStorageSync (key) {
  my.removeStorageSync({
    key
  })
}

function clearStorage (options) {
  my.clearStorage(options)
}

function clearStorageSync (options) {
  my.clearStorageSync(options)
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
