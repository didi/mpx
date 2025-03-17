import { Suspense, ReactNode } from 'react'
import ErrorBoundary from './AsyncErrorBoundary'
import usePageLayoutEffect from './usePageLayoutEffectReact'
import { View, Text, StyleSheet } from 'react-native'

interface DefaultLoadingProps {
  text?: string
}

const DefaultLoading = ({ text = '加载中...' }: DefaultLoadingProps) => {
  return (
    <View style={styles.container}>
      <Text style={styles.text}>{text}</Text>
    </View>
  )
}

interface DefaultFallbackProps {
  onReload: () => void
}

const DefaultFallback = ({ onReload }: DefaultFallbackProps) => {
  return (
    <View style={styles.container}>
      <Text style={styles.text} onPress={onReload}>页面加载失败，请点击重试</Text>
    </View>
  )
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: 20,
    backgroundColor: '#fff' // 白色背景
  },
  spinner: {
    marginBottom: 10
  },
  text: {
    fontSize: 16,
    textAlign: 'center',
    color: '#333' // 深灰色文字
  }
})

interface AsyncPageProps {
  // children: ReactNode
  fallback: React.ComponentType<any>
  loading: React.ComponentType<any>
  asyncPage: React.ComponentType<any>
  _props: any
}

const AsyncPage = (props: AsyncPageProps) => {
  const pageConfig = global.__mpxPageConfig || {}
  const {
    loading: Loading = DefaultLoading,
    fallback: Fallback = DefaultFallback,
    asyncPage: AsyncPage
  } = props
  usePageLayoutEffect(props._props.navigation, pageConfig)
  return (
    <ErrorBoundary asyncType='page' fallback={({ onReload }) => <Fallback onReload={onReload}></Fallback>}>
      <Suspense fallback={<Loading />}>
        {/* {props.children} */}
        <AsyncPage {...props._props}></AsyncPage>
      </Suspense>
    </ErrorBoundary>
  )
}

AsyncPage.displayName = 'AsyncPageContainer'

export default AsyncPage
