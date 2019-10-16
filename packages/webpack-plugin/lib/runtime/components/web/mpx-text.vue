<script>
  export default {
    name: 'mpx-text',
    functional: true,
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
    render (createElement, context) {
      let text = ''
      let classNames = ['mpx-text']
      let decode = false
      context.children.forEach((item) => {
        if (typeof item === 'string') {
          text += item
        }
      })
      if (context.props.selectable) {
        classNames.push('selectable')
      }
      switch (context.props.space) {
        case 'ensp':
        case 'emsp':
        case 'nbsp':
          decode = true
          text = text.replace(/ /g, `&${context.props.space};`)
          break
      }
      if (context.props.decode) {
        decode = true
      }
      const data = {
        class: classNames
      }
      if (decode) {
        data.domProps = {
          innerHTML: text
        }
      }
      return createElement('span', data, text)
    }
  }
</script>

<style lang="stylus">
  .mpx-text
    user-select none

    &.selectable
      user-select text
</style>
