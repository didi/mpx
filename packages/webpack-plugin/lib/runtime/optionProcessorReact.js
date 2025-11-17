import AsyncSuspense from '@mpxjs/webpack-plugin/lib/runtime/components/react/dist/mpx-async-suspense'
import { memo, forwardRef, createElement } from 'react'
import { error } from '@mpxjs/utils'
import { extend } from './utils'

export function getComponent (component, extendOptions) {
  component = component.__esModule ? component.default : component
  if (!component) {
    error(
      `getComponent expecting a function/class component ${extendOptions?.displayName ? `[${extendOptions.displayName}]` : ''} as first argument, but got undefined.`
    )
    return null
  }
  // eslint-disable-next-line
  if (extendOptions && !component.__mpxExtended) {
    extend(component, extendOptions, { __mpxExtended: true })
  }
  return component
}

export function getAsyncSuspense (commonProps) {
  let result
  if (commonProps.type === 'component') {
    result = memo(forwardRef(function (props, ref) {
      return createElement(AsyncSuspense,
        extend({}, commonProps, {
          innerProps: extend({}, props, { ref })
        })
      )
    }))
  } else {
    result = memo(function (props) {
      return createElement(AsyncSuspense,
        extend({}, commonProps, {
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
