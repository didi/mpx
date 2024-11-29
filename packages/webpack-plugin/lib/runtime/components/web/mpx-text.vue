<script>
  import getInnerListeners from './getInnerListeners'

  const encodeMap = {
    ' ': '&nbsp;',
    '<': '&lt;',
    '>': '&gt;',
    '&': '&amp;',
    '"': '&quot;',
    '\'': '&apos;'
  }

  const encodeRe = /[ <>"'&]/g

  function encodeText (text) {
    return text.replace(encodeRe, (match) => {
      return encodeMap[match]
    })
  }

  export default {
    name: 'mpx-text',
    props: {
      selectable: {
        type: Boolean,
        default: false
      },
      space: {
        type: String
      },
      decode: {
        type: Boolean,
        default: false
      }
    },
    render (createElement) {
      let classNames = ['mpx-text']
      let decode = false
      const slots = this.$slots.default || []
      const newSlots = []
      slots.forEach((item) => {
        if (item.text) {
          switch (this.space) {
            case 'ensp':
            case 'emsp':
            case 'nbsp':
              decode = true
              item.text = item.text.replace(/ /g, `&${this.space};`)
              break
          }
          newSlots.push(createElement('span', {
            domProps: {
              innerHTML: item.text
            }
          }))
        } else {
          newSlots.push(item)
        }
      })
      if (this.selectable) {
        classNames.push('selectable')
      }
      if (this.decode) {
        decode = true
      }
      const data = {
        class: classNames,
        on: getInnerListeners(this)
      }
      return createElement('span', data, decode ? newSlots : slots)
    }
  }
</script>

<style lang="stylus">
  .mpx-text
    user-select none

    &.selectable
      user-select text
</style>
