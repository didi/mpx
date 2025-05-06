import { ComponentType, ReactNode, Component, Fragment, Suspense, ErrorInfo } from 'react'
import { View, Text, Image, StyleSheet, TouchableOpacity } from 'react-native'

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
    backgroundColor: '#fff',
    paddingVertical: 15,
    borderRadius: 30,
    marginTop: 40,
    borderWidth: 1,
    borderColor: '#FF5F00',
    marginLeft: 20,
    marginRight: 20
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
  fallback: T extends 'page' ? ComponentType<DefaultFallbackProps> : ReactNode
  loading?: ComponentType<any>
  type: T
  children: ReactNode
}

interface StateType {
  hasError: boolean,
  key: number
}

interface ComponentError extends Error {
  request?: string
}

const DefaultLoading = () => {
  return (
    <View style={styles.container}>
      <Image
        style={styles.loadingImage}
        source={{ uri: 'https://dpubstatic.udache.com/static/dpubimg/439jiCVOtNOnEv9F2LaDs_loading.gif' }}
        resizeMode='contain'></Image>
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
    }
    return undefined
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
      return this.props.fallback as ReactNode
    }
  }

  getErrorFallback () {
    if (this.props.type === 'page') {
      const Fallback = this.props.fallback as ComponentType<DefaultFallbackProps> || DefaultFallback
      return <Fallback onReload={this.reloadPage.bind(this)}></Fallback>
    } else {
      return this.props.fallback as ReactNode
    }
  }

  render () {
    if (this.state.hasError) {
      return this.errorFallback
    } else {
      return (
        <Fragment key={this.state.key}>
          <Suspense fallback={this.suspenseFallback}>
            {this.props.children}
          </Suspense>
        </Fragment>
      )
    }
  }
}
