import AsyncSuspense from '@mpxjs/webpack-plugin/lib/runtime/components/react/dist/AsyncSuspense'
import { memo, forwardRef, createElement } from 'react'
import { extend } from './utils'

export function getComponent (component, extendOptions) {
  component = component.__esModule ? component.default : component
  // eslint-disable-next-line
  if (extendOptions) Object.assign(component, extendOptions)
  return component
}

export function getAsyncSuspense (commonProps) {
  if (commonProps.type === 'component') {
    return memo(forwardRef(function (props, ref) {
      return createElement(AsyncSuspense,
        extend(commonProps, {
          innerProps: Object.assign({}, props, { ref })
        })
      )
    }))
  } else {
    return function (props) {
      return createElement(AsyncSuspense,
        extend(commonProps, {
          innerProps: props
        })
      )
    }
  }
}
