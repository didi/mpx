import mpx from '@mpxjs/core'
import { compilePage } from './compile-page'

// recompileComment: 1640768336242

mpx.mixin({
  onPageNotFound (res) {
    compilePage(res.path)
  }
})

