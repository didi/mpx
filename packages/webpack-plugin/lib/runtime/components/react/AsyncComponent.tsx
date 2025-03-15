import { Suspense, memo, ReactNode, lazy, ComponentType } from 'react'
import ErrorBoundary from './AsyncErrorBoundary'

interface AsyncComponentProps {
  children: ReactNode
  chunkName: string
  componentRequest: Promise<{ default: ComponentType<any> }>
  fallback: ReactNode
}

const AsyncComponent = memo(function AsyncComponent (props: AsyncComponentProps) {
  // const LazyComponent = lazy(() => props.componentRequest)
  return (
    <ErrorBoundary asyncType='component' fallback={props.fallback}>
      <Suspense fallback={props.fallback}>
        {props.children}
        {/* <LazyComponent {...props}></LazyComponent> */}
      </Suspense>
    </ErrorBoundary>
  )
})

export default AsyncComponent
