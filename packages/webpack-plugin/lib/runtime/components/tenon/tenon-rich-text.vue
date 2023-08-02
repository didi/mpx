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
  computed: {
    originRef() {
      return this.$refs["mpx-richtext"]
    }
  },
  render () {
    const data = {
      richText: this.richText,
      ref: "mpx-richtext",
      ...getInnerListeners(this)
    }
    return h('text', data)
  }
}
</script>