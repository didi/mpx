<script>
  import getInnerListeners from '@mpxjs/webpack-plugin/lib/runtime/components/web/getInnerListeners'

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
      let text = ''
      let classNames = ['mpx-text']
      let decode = false
      this.$slots.default.forEach((item) => {
        if (item.text) {
          // item.text = encodeText(item.text)
          text += item.text
        }
      })
      if (this.selectable) {
        classNames.push('selectable')
      }
      switch (this.space) {
        case 'ensp':
        case 'emsp':
        case 'nbsp':
          decode = true
          text = text.replace(/ /g, `&${this.space};`)
          break
      }
      if (this.decode) {
        decode = true
      }
      const data = {
        class: classNames,
        on: getInnerListeners(this)
      }
      if (decode) {
        data.domProps = {
          innerHTML: text
        }
      }
      return createElement('span', data, this.$slots.default)
    }
  }
</script>

<style lang="stylus">
  .mpx-text
    user-select none

    &.selectable
      user-select text
</style>
