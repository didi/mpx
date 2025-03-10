import { Suspense, memo, ReactNode } from 'react'
import ErrorBoundary from './AsyncErrorBoundary'

interface AsyncComponentProps {
  children: ReactNode
  fallback: ReactNode
}

const AsyncComponent = memo(function AsyncComponent(props: AsyncComponentProps) {
  return (
    <ErrorBoundary asyncType='component' fallback={props.fallback}>
      <Suspense fallback={props.fallback}>
        {props.children}
      </Suspense>
    </ErrorBoundary>
  )
})

export default AsyncComponent
