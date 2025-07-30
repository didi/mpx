import { useState, ComponentType, useEffect, useCallback, useRef, ReactNode, createElement } from 'react'
import { View, Image, StyleSheet, Text, TouchableOpacity } from 'react-native'
import FastImage from '@d11/react-native-fast-image'

const asyncChunkMap = new Map()

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 20,
    backgroundColor: '#fff'
  },
  loadingImage: {
    width: 100,
    height: 100,
    marginTop: 220,
    alignSelf: 'center'
  },
  buttonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '500',
    textAlign: 'center'
  },
  errorImage: {
    marginTop: 80,
    width: 220,
    aspectRatio: 1,
    alignSelf: 'center'
  },
  errorText: {
    fontSize: 16,
    textAlign: 'center',
    color: '#333',
    marginBottom: 20
  },
  retryButton: {
    position: 'absolute',
    bottom: 54,
    left: 20,
    right: 20,
    backgroundColor: '#fff',
    paddingVertical: 15,
    borderRadius: 30,
    marginTop: 40,
    borderWidth: 1,
    borderColor: '#FF5F00'
  },
  retryButtonText: {
    color: '#FF5F00',
    fontSize: 16,
    fontWeight: '500',
    textAlign: 'center'
  }
})

interface DefaultFallbackProps {
  onReload: () => void
}

const DefaultFallback = ({ onReload }: DefaultFallbackProps) => {
  return (
    <View style={styles.container}>
      <Image
        source={{
          uri: 'https://dpubstatic.udache.com/static/dpubimg/Vak5mZvezPpKV5ZJI6P9b_drn-fallbak.png'
        }}
        style={styles.errorImage}
        resizeMode="contain"
      />
      <Text style={styles.errorText}>网络出了点问题，请查看网络环境</Text>
      <TouchableOpacity
        style={styles.retryButton}
        onPress={onReload}
        activeOpacity={0.7}
      >
        <Text style={styles.retryButtonText}>点击重试</Text>
      </TouchableOpacity>
    </View>
  )
}

const DefaultLoading = () => {
  return (
    <View style={styles.container}>
      <FastImage
        style={styles.loadingImage}
        source={{
          uri: 'https://dpubstatic.udache.com/static/dpubimg/439jiCVOtNOnEv9F2LaDs_loading.gif'
        }}
        resizeMode={FastImage.resizeMode.contain}
      ></FastImage>
    </View>
  )
}

interface AsyncSuspenseProps {
  type: 'component' | 'page'
  chunkName: string
  moduleId: string
  innerProps: any,
  getLoading?: () => ComponentType<unknown>
  getFallback?: () => ComponentType<unknown>
  getChildren: () => Promise<ReactNode>
}

type ComponentStauts = 'pending' | 'error' | 'loaded'

const AsyncSuspense: React.FC<AsyncSuspenseProps> = ({
  type,
  chunkName,
  moduleId,
  innerProps,
  getLoading,
  getFallback,
  getChildren
}) => {
  const [status, setStatus] = useState<ComponentStauts>('pending')
  const chunkLoaded = asyncChunkMap.has(moduleId)
  const loadChunkPromise = useRef<null | Promise<ReactNode>>(null)

  const reloadPage = useCallback(() => {
    setStatus('pending')
  }, [])

  useEffect(() => {
    let cancelled = false
    if (!chunkLoaded && status === 'pending') {
      if (loadChunkPromise.current) {
        loadChunkPromise
          .current.then((res: ReactNode) => {
            if (cancelled) return
            asyncChunkMap.set(moduleId, res)
            setStatus('loaded')
          })
          .catch((e) => {
            if (cancelled) return
            if (type === 'component') {
              global.onLazyLoadError({
                type: 'subpackage',
                subpackage: [chunkName],
                errMsg: `loadSubpackage: ${e.type}`
              })
            }
            if (type === 'page' && typeof mpxGlobal.__mpx.config?.rnConfig?.lazyLoadPageErrorHandler === 'function') {
              mpxGlobal.__mpx.config.rnConfig.lazyLoadPageErrorHandler({
                subpackage: chunkName,
                errType: e.type
              })
            }
            loadChunkPromise.current = null
            setStatus('error')
          })
      }
    }

    return () => {
      cancelled = true
    }
  }, [status])

  if (chunkLoaded) {
    const Comp = asyncChunkMap.get(moduleId)
    return createElement(Comp, innerProps)
  } else if (status === 'error') {
    if (type === 'page') {
      const fallback = getFallback ? getFallback() : DefaultFallback
      return createElement(fallback as ComponentType<DefaultFallbackProps>, { onReload: reloadPage })
    } else {
      return getFallback ? createElement(getFallback(), innerProps) : null
    }
  } else {
    if (!loadChunkPromise.current) {
      loadChunkPromise.current = getChildren()
    }
    if (type === 'page') {
      const loading = getLoading ? getLoading() : DefaultLoading
      return createElement(loading)
    } else {
      return getFallback ? createElement(getFallback(), innerProps) : null
    }
  }
}

AsyncSuspense.displayName = 'MpxAsyncSuspense'

export default AsyncSuspense
