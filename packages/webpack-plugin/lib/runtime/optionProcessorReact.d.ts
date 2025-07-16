import { ReactNode, ComponentType } from 'react'
declare global {
  namespace NodeJS {
    interface Global {
      [key: string]: any
    }
  }
}

export function getComponent (...args: any): object

interface AsyncModule {
  __esModule: boolean
  default: ReactNode
}

interface AsyncSuspenseProps {
  type: 'component' | 'page'
  chunkName: string
  moduleId: string
  innerProps: any
  loading: ComponentType<unknown>
  fallback: ComponentType<unknown>
  getChildren: () => Promise<AsyncModule>
}

export function getAsyncSuspense(props: AsyncSuspenseProps): ReactNode
