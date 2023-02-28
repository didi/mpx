function getRelativePath (source, target) {
  // make sure source and target are absolute path
  /^\//.test(source) || (source = '/' + source);
  /^\//.test(target) || (target = '/' + target)

  source = source && source.replace(/\/[^/]*$/, '') // get dirname
  // check if source or target is root path
  const sourceArr = source.split('/').filter((item, index) => index !== 0 && !!item)
  const targetArr = target.split('/').filter((item, index) => index !== 0 && !!item)
  let i = 0
  while (sourceArr[i] === targetArr[i] && i < sourceArr.length && i < targetArr.length) {
    i++
  }
  let relativePath = ''
  for (let j = 0; j < sourceArr.length - i; j++) {
    relativePath += '../'
  }
  relativePath += targetArr.slice(i).join('/')
  if (relativePath[0] !== '.') relativePath = './' + relativePath
  return relativePath
}

module.exports = {
  getRelativePath
}
