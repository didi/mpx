<script>
import getInnerListeners from './getInnerListeners'
import { h } from '@hummer/tenon-vue'
export default {
  name: 'mpx-rich-text',
  props: {
    richText: {
      type: Object,
      value: {}
    }
  },
  render () {

    const data = {
      richText: this.richText,
      ...getInnerListeners(this)
    }
    return h('text', data)
  }
}
</script>