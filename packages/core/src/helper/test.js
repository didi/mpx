function diffAndCloneA (a, b) {

  const diffPaths = []
  const curPath = []
  let diff = false

  function deepDiffAndCloneA (a, b, curentDiff) {
    const setDiff = (val) => {
      if (curentDiff) return
      if (val) {
        curentDiff = val
        diffPaths.push(curPath.slice())
      }
    }

    const toString = Object.prototype.toString
    const type = typeof a
    let clone = a

    if (type !== 'object' || a === null) {
      setDiff(a !== b)
    } else {
      // a = unwrap(a)
      // b = unwrap(b)
      let sameClass = true

      const className = toString.call(a)
      if (className !== toString.call(b)) {
        setDiff(true)
        sameClass = false
      }
      let length
      switch (className) {
        case '[object RegExp]':
        case '[object String]':
          if (sameClass) setDiff('' + a !== '' + b)
          break
        case '[object Number]':
        case '[object Date]':
        case '[object Boolean]':
          if (sameClass) setDiff(+a !== +b)
          break
        case '[object Symbol]':
          if (sameClass) setDiff(a !== b)
          break
        case '[object Array]':
          length = a.length
          if (sameClass && length !== b.length) {
            setDiff(true)
          }
          clone = []
          while (length--) {
            curPath.push(length)
            clone[length] = deepDiffAndCloneA(a[length], sameClass ? b[length] : undefined, curentDiff)
            curPath.pop()
          }
          break
        default:
          let keys = Object.keys(a), key
          length = keys.length
          clone = {}
          while (length--) {
            key = keys[length]
            curPath.push(key)
            clone[key] = deepDiffAndCloneA(a[key], sameClass ? b[key] : undefined, curentDiff)
            curPath.pop()
          }
      }
    }
    if (curentDiff) {
      diff = curentDiff
    }
    return clone
  }

  let clone = deepDiffAndCloneA(a, b, diff)

  return {
    clone,
    diff,
    diffPaths
  }
}

let a = {
  aaa: [123, 321, { bbb: { ccc: 3 }, ddd: 2 }],
}


let b = {
  aaa: [123, 322, { bbb: { ccc: 3 } }],
}


let { clone, diff, diffPaths } = diffAndCloneA(a, {})

// let isSame = clone === a || clone.aaa === a.aaa || clone.aaa[2] === a.aaa[2] || clone.aaa[2].bbb === a.aaa[2].bbb

debugger