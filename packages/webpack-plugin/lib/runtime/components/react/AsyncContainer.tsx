import { ComponentType, ReactNode, Component, Suspense } from 'react'
import { View, Text, Image, StyleSheet, TouchableOpacity } from 'react-native'
import FastImage from '@d11/react-native-fast-image'
import Animated, { useAnimatedStyle } from 'react-native-reanimated'

type PageWrapper = {
  children: ReactNode
}

const PageWrapper = ({ children }: PageWrapper) => {
  const animatedStyle = useAnimatedStyle(() => ({
    transform: [{ translateY: -0 }],
    flexBasis: 'auto',
    flex: 1
  }))

  return (
    <Animated.View
      style={[
        animatedStyle
      ]}
    >
      {children}
    </Animated.View>
  )
}


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

type AsyncType = 'page' | 'component'

interface PropsType<T extends AsyncType> {
  type: T
  props: object
  loading: ComponentType<unknown>
  fallback: ComponentType<unknown>
  children: (props: unknown) => ReactNode
}

interface StateType {
  hasError: boolean,
  key: number
}

interface ComponentError extends Error {
  request?: string
  type: 'timeout' | 'fail'
}

const DefaultLoading = () => {
  return (
    <View style={styles.container}>
      <FastImage
        style={styles.loadingImage}
        source={{ uri: 'https://dpubstatic.udache.com/static/dpubimg/439jiCVOtNOnEv9F2LaDs_loading.gif' }}
        resizeMode={FastImage.resizeMode.contain}></FastImage>
    </View>
  )
}

interface DefaultFallbackProps {
  onReload: () => void
}

const DefaultFallback = ({ onReload }: DefaultFallbackProps) => {
  return (
    <View style={styles.container}>
      <Image
        source={{ uri: 'https://dpubstatic.udache.com/static/dpubimg/Vak5mZvezPpKV5ZJI6P9b_drn-fallbak.png' }}
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

export default class AsyncContainer extends Component<PropsType<AsyncType>, StateType> {
  private suspenseFallback: ReactNode
  private errorFallback: ReactNode

  constructor (props: PropsType<AsyncType>) {
    super(props)
    this.state = {
      hasError: false,
      key: 0
    }
    this.suspenseFallback = this.getSuspenseFallback()
    this.errorFallback = this.getErrorFallback()
  }

  // render 阶段收集到的错误
  static getDerivedStateFromError (error: ComponentError): StateType | undefined {
    if (error.name === 'ChunkLoadError') {
      return {
        hasError: true,
        key: 0
      }
    } else {
      // 被外层捕获
      throw error
    }
  }

  componentDidCatch (error: ComponentError): void {
    if (error.name === 'ChunkLoadError' && this.props.type === 'component') {
      const request = error.request || ''
      const subpackage = request.split('/').filter((i: string) => !!i)[0]
      global.onLazyLoadError({
        type: 'subpackage',
        subpackage: [subpackage],
        errMsg: `loadSubpackage: ${error.type}`
      })
    }
  }

  reloadPage () {
    this.setState((prevState) => {
      return {
        hasError: false,
        key: prevState.key + 1
      }
    })
  }

  getSuspenseFallback () {
    if (this.props.type === 'page') {
      const Fallback = this.props.loading || DefaultLoading
      return <Fallback />
    } else {
      const Fallback = this.props.loading
      return <Fallback {...this.props.props}></Fallback>
    }
  }

  getErrorFallback () {
    if (this.props.type === 'page') {
      const Fallback = this.props.fallback as ComponentType<DefaultFallbackProps> || DefaultFallback
      return <Fallback onReload={this.reloadPage.bind(this)}></Fallback>
    } else {
      const Fallback = this.props.loading
      return <Fallback {...this.props.props}></Fallback>
    }
  }

  render () {
    if (this.state.hasError) {
      if (this.props.type === 'component') {
        return this.errorFallback
      } else {
        return (<PageWrapper>{this.errorFallback}</PageWrapper>)
      }
    } else {
      return (
        <Suspense fallback={this.suspenseFallback} key={this.state.key}>
          {this.props.children(this.props.props)}
        </Suspense>
      )
    }
  }
}
