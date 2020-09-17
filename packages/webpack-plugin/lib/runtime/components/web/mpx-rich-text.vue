<script>
import { parse, htmlTranStr } from './filterTag.js'
import getInnerListeners from './getInnerListeners'
export default {
  name: 'mpx-rich-text',
  props: {
    nodes:  [Array, String],
    space: {
      type: String
    }
  },
  render (createElement) {
    const slots = this.$slots.default || []
    let nodes = this.nodes
    let html = ''
    if (typeof this.nodes === 'string') {
      nodes = parse(this.nodes)
    }
    if (Array.isArray(nodes)) {
      html = htmlTranStr(nodes, this.space)
    }
    const data = {
      domProps: {
        innerHTML: html
      },
      on: getInnerListeners(this)
    }
    return createElement('div', data, slots)
  }
}
</script>
