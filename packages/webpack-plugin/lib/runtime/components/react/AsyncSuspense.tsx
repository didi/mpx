import { useState, ComponentType, useEffect, useCallback, useRef } from 'react'
import { DefaultFallback, DefaultLoading, PageWrapper } from './AsyncContainer'
import type { DefaultFallbackProps } from './AsyncContainer'

const asyncChunkMap = new Map()


interface props {
  type: 'component' | 'page'
  chunkName: string
  request: string
  props: any,
  loading: ComponentType<unknown>
  fallback: ComponentType<unknown>
  getChildren: () => Promise<unknown>
}

const AsyncSuspense: React.FC<props> = ({ type, props, chunkName, request, loading, fallback, getChildren }) => {
  const [status, setStatus] = useState('pending')
  const loaded = asyncChunkMap.has(request)
  const [, setKey] = useState(0)
  let chunkPromise = useRef<null | Promise<unknown>>(null)

  const reloadPage = useCallback(() => {
    setKey((preV) => preV + 1)
    console.log('[mpxAsyncSuspense]: reload page')
    setStatus('pending')
  }, [])

  useEffect(() => {
    if (!loaded && status === 'pending') {
      // todo 清楚副作用？
      console.log('the current :', chunkPromise.current)
      chunkPromise.current!
        .then((m: any) => {
          console.log('[mpxAsyncSuspense]: load sucess')
          asyncChunkMap.set(request, m.__esModule ? m.default : m)
          setStatus('loaded')
        })
        .catch((e) => {
          if (type === 'component') {
            console.log(11111, e)
            global.onLazyLoadError({
              type: 'subpackage',
              subpackage: [chunkName],
              errMsg: `loadSubpackage: ${e.type}`
            })
          }
          console.log('[mpxAsyncSuspense]: load eror', e)
          chunkPromise.current = null
          setStatus('error')
        })
    }
  })

  if (loaded) {
    const Comp = asyncChunkMap.get(request)
    return <Comp {...props}></Comp>
  } else if (status === 'error') {
    console.log('the status is:', status)
    if (type === 'page') {
      const Fallback = fallback as ComponentType<DefaultFallbackProps> || DefaultFallback
      return <><PageWrapper><Fallback onReload={reloadPage}></Fallback></PageWrapper></>
    } else {
      const Fallback = loading
      return <Fallback {...props}></Fallback>
    }
  } else {
    if (!chunkPromise.current) {
      chunkPromise.current = getChildren()
    }
    if (type === 'page') {
      const Fallback = loading || DefaultLoading
      return <PageWrapper><Fallback /></PageWrapper>
    } else {
      const Fallback = loading
      return <Fallback {...props}></Fallback>
    }
  }
}

export default AsyncSuspense
