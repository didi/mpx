import AsyncSuspense from '@mpxjs/webpack-plugin/lib/runtime/components/react/dist/mpx-async-suspense'
import { memo, forwardRef, createElement } from 'react'
import { error, isValidReactComponent } from '@mpxjs/utils'
import { extend } from './utils'

export function getComponent (component, extendOptions) {
  component = component.__esModule ? component.default : component
  if (!isValidReactComponent(component)) {
    error(
      `getComponent expecting valid React component ${extendOptions?.displayName ? `[${extendOptions.displayName}] ` : ''}as the first argument, but got ${component === null ? 'null' : typeof component}.`,
      extendOptions?.mpxFileResource
    )
    return null
  }
  // eslint-disable-next-line
  if (extendOptions && !component.__mpxExtended) {
    extend(component, extendOptions, { __mpxExtended: true })
    const render = (component.type && component.type.render) || component.render
    const displayName = extendOptions.displayName || component.displayName
    if (render && displayName && !render.displayName) {
      render.displayName = displayName
    }
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
