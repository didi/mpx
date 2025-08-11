import AsyncSuspense from '@mpxjs/webpack-plugin/lib/runtime/components/react/dist/mpx-async-suspense'
import { memo, forwardRef, createElement } from 'react'
import { extend } from './utils'

export function getComponent (component, extendOptions) {
  component = component.__esModule ? component.default : component
  // eslint-disable-next-line
  if (extendOptions) Object.assign(component, extendOptions)
  return component
}

export function getAsyncSuspense (commonProps) {
  let result
  if (commonProps.type === 'component') {
    result = memo(forwardRef(function (props, ref) {
      return createElement(AsyncSuspense,
        extend(commonProps, {
          innerProps: Object.assign({}, props, { ref })
        })
      )
    }))
  } else {
    result = memo(function (props) {
      return createElement(AsyncSuspense,
        extend(commonProps, {
          innerProps: props
        })
      )
    })
  }
  result.displayName = 'AsyncSuspenseHOC'
  return result
}

export function getLazyPage (getComponent) {
  return function (props) {
    return createElement(getComponent(), props)
  }
}
