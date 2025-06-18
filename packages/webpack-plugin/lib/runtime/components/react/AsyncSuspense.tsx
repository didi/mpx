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

interface LayoutViewProps {
  children: ReactNode
}

interface AsyncModule {
  __esModule: boolean
  default: ReactNode
}

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

const LayoutView = (props: LayoutViewProps) => {
  return (
    <View style={{ flex: 1 }} collapsable={false}>{props.children}</View>
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
  props: any,
  loading: ComponentType<unknown>
  fallback: ComponentType<unknown>
  getChildren: () => Promise<AsyncModule>
}

type ComponentStauts = 'pending' | 'error' | 'loaded'

const AsyncSuspense: React.FC<AsyncSuspenseProps> = ({
  type,
  props,
  chunkName,
  moduleId,
  loading,
  fallback,
  getChildren
}) => {
  const [status, setStatus] = useState<ComponentStauts>('pending')
  const chunkLoaded = asyncChunkMap.has(moduleId)
  const loadChunkPromise = useRef<null | Promise<AsyncModule>>(null)

  const reloadPage = useCallback(() => {
    setStatus('pending')
  }, [])

  useEffect(() => {
    let cancelled = false
    if (!chunkLoaded && status === 'pending') {
      loadChunkPromise
        .current!.then((m: AsyncModule) => {
          if (cancelled) return
          asyncChunkMap.set(moduleId, m.__esModule ? m.default : m)
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
          loadChunkPromise.current = null
          setStatus('error')
        })
    }

    return () => {
      cancelled = true
    }
  }, [status])

  if (chunkLoaded) {
    const Comp = asyncChunkMap.get(moduleId)
    return createElement(Comp, props)
  } else if (status === 'error') {
    if (type === 'page') {
      const Fallback =
        (fallback as ComponentType<DefaultFallbackProps>) || DefaultFallback
      return createElement(LayoutView, null, createElement(Fallback, { onReload: reloadPage }))
    } else {
      return createElement(loading, props)
    }
  } else {
    if (!loadChunkPromise.current) {
      loadChunkPromise.current = getChildren()
    }
    if (type === 'page') {
      return createElement(LayoutView, null, createElement(loading || DefaultLoading))
    } else {
      return createElement(loading, props)
    }
  }
}

export default AsyncSuspense
