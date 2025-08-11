import through from './through'

const PSEUDOSTART = 'pseudo-start'
const ATTR_START = 'attr-start'
const ANY_CHILD = 'any-child'
const ATTR_COMP = 'attr-comp'
const ATTR_END = 'attr-end'
const PSEUDOPSEUDO = '::'
const PSEUDOCLASS = ':'
const READY = '(ready)' // 重置标志位
const OPERATION = 'op'
const CLASS = 'class'
const COMMA = 'comma'
const ATTR = 'attr'
const SUBJECT = '!'
const TAG = 'tag'
const STAR = '*'
const ID = 'id'

export default function tokenize () {
  let escaped = false
  let gathered = []
  let state = READY
  let data = []
  let idx = 0
  let stream
  let length
  let quote
  let depth
  let lhs
  let rhs
  let cmp
  let c

  return (stream = through(ondata, onend))

  function ondata (chunk) {
    data = data.concat(chunk.split(''))
    length = data.length

    while (idx < length && (c = data[idx++])) {
      switch (state) {
        case READY:
          state_ready()
          break
        case ANY_CHILD:
          state_any_child()
          break
        case OPERATION:
          state_op()
          break
        case ATTR_START:
          state_attr_start()
          break
        case ATTR_COMP:
          state_attr_compare()
          break
        case ATTR_END:
          state_attr_end()
          break
        case PSEUDOCLASS:
        case PSEUDOPSEUDO:
          state_pseudo()
          break
        case PSEUDOSTART:
          state_pseudostart()
          break
        case ID:
        case TAG:
        case CLASS:
          state_gather()
          break
      }
    }

    data = data.slice(idx)

    if (gathered.length) {
      stream.queue(token())
    }
  }

  function onend (chunk) {
    // if (arguments.length) {
    //   ondata(chunk)
    // }

    // if (gathered.length) {
    //   stream.queue(token())
    // }
  }

  function state_ready () {
    switch (true) {
      case c === '#':
        state = ID
        break
      case c === '.':
        state = CLASS
        break
      case c === ':':
        state = PSEUDOCLASS
        break
      case c === '[':
        state = ATTR_START
        break
      case c === '!':
        subject()
        break
      case c === '*':
        star()
        break
      case c === ',':
        comma()
        break
      case /[>+~]/.test(c):
        state = OPERATION
        break
      case /\s/.test(c):
        state = ANY_CHILD
        break
      case /[\w\d\-_]/.test(c):
        state = TAG
        --idx
        break
    }
  }

  function subject () {
    state = SUBJECT
    gathered = ['!']
    stream.queue(token())
    state = READY
  }

  function star () {
    state = STAR
    gathered = ['*']
    stream.queue(token())
    state = READY
  }

  function comma () {
    state = COMMA
    gathered = [',']
    stream.queue(token())
    state = READY
  }

  function state_op () {
    if (/[>+~]/.test(c)) {
      return gathered.push(c)
    }

    // chomp down the following whitespace.
    if (/\s/.test(c)) {
      return
    }

    stream.queue(token())
    state = READY
    --idx // 指针左移，归档，开始匹配下一个 token
  }

  function state_any_child () {
    if (/\s/.test(c)) {
      return
    }

    if (/[>+~]/.test(c)) {
      --idx
      state = OPERATION
      return state
      // return --idx, (state = OPERATION)
    }

    // 生成 any_child 节点，并重置状态
    stream.queue(token())
    state = READY
    --idx
  }

  function state_pseudo () {
    rhs = state
    state_gather(true)

    if (state !== READY) {
      return
    }

    if (c === '(') {
      lhs = gathered.join('')
      state = PSEUDOSTART
      gathered.length = 0
      depth = 1
      ++idx

      return
    }

    state = PSEUDOCLASS
    stream.queue(token())
    state = READY
  }

  function state_pseudostart () {
    if (gathered.length === 0 && !quote) {
      quote = /['"]/.test(c) ? c : null

      if (quote) {
        return
      }
    }

    if (quote) {
      if (!escaped && c === quote) {
        quote = null

        return
      }

      if (c === '\\') {
        escaped ? gathered.push(c) : (escaped = true)

        return
      }

      escaped = false
      gathered.push(c)

      return
    }

    gathered.push(c)

    if (c === '(') {
      ++depth
    } else if (c === ')') {
      --depth
    }

    if (!depth) {
      gathered.pop()
      stream.queue({
        type: rhs,
        data: lhs + '(' + gathered.join('') + ')'
      })

      state = READY
      lhs = rhs = cmp = null
      gathered.length = 0
    }
  }

  function state_attr_start () {
    // 在收集字符的阶段，还会有 state 标志位的判断，因此会影响到下面的逻辑执行
    state_gather(true)

    if (state !== READY) {
      return
    }

    if (c === ']') {
      state = ATTR
      stream.queue(token())
      state = READY

      return
    }

    lhs = gathered.join('')
    gathered.length = 0
    state = ATTR_COMP
  }

  // 属性选择器：https://www.w3school.com.cn/css/css_attribute_selectors.asp
  function state_attr_compare () {
    if (/[=~|$^*]/.test(c)) {
      gathered.push(c)
    }

    // 操作符&=
    if (gathered.length === 2 || c === '=') {
      cmp = gathered.join('')
      gathered.length = 0
      state = ATTR_END
      quote = null
    }
  }

  function state_attr_end () {
    if (!gathered.length && !quote) {
      quote = /['"]/.test(c) ? c : null

      if (quote) {
        return
      }
    }

    if (quote) {
      if (!escaped && c === quote) {
        quote = null

        return
      }

      if (c === '\\') {
        if (escaped) {
          gathered.push(c)
        }

        escaped = !escaped

        return
      }

      escaped = false
      gathered.push(c)

      return
    }

    state_gather(true)

    if (state !== READY) {
      return
    }

    stream.queue({
      type: ATTR,
      data: {
        lhs: lhs,
        rhs: gathered.join(''),
        cmp: cmp
      }
    })

    state = READY
    lhs = rhs = cmp = null
    gathered.length = 0
  }

  function state_gather (quietly) {
    // 如果是非单词字符，例如 空格。会更新 state 的状态
    if (/[^\d\w\-_]/.test(c) && !escaped) {
      if (c === '\\') {
        escaped = true
      } else {
        !quietly && stream.queue(token())
        state = READY
        --idx
      }

      return
    }

    escaped = false
    gathered.push(c)
  }

  function token () {
    const data = gathered.join('')

    gathered.length = 0

    return {
      type: state,
      data: data
    }
  }
}
