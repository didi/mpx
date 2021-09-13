<script>
import { parse, htmlTranStr } from './filterTag.js'
import getInnerListeners from './getInnerListeners'
import { h } from '@hummer/tenon-vue'
export default {
  name: 'mpx-rich-text',
  props: {
    nodes:  [Array, String],
    space: {
      type: String
    }
  },
  render () {
    let nodes = this.nodes
    let html = ''
    if (typeof this.nodes === 'string') {
      nodes = parse(this.nodes)
    }
    if (Array.isArray(nodes)) {
      html = htmlTranStr(nodes, this.space)
    }
    console.log('html--------', html)
    const data = {
      richText: html,
      ...getInnerListeners(this)
    }
    return h('text', data)
  }
}
</script>