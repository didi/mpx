import { Suspense, memo } from 'react'
import ErrorBoundary from './AsyncErrorBoundary'

interface AsyncComponentProps {
  // children: ReactNode,
  _props: Record<any, any>,
  asyncComponent: React.ComponentType<any>
  fallback: React.ComponentType<any>
}

const AsyncComponent = memo(function AsyncComponent (props: AsyncComponentProps) {
  const { fallback: Fallback, asyncComponent: AsyncComponent } = props
  return (
    <ErrorBoundary asyncType='component' fallback={() => <Fallback {...props._props}></Fallback>}>
      <Suspense fallback={<Fallback {...props._props}></Fallback>}>
        {/* {props.children} */}
        <AsyncComponent {...props._props}></AsyncComponent>
      </Suspense>
    </ErrorBoundary>
  )
})

export default AsyncComponent
