/**
 * ✔ show
 * ✔ overlay
 * ✔ bind:beforeleave
 */
import { ReactNode, useContext, useEffect, useRef } from 'react'
import { StyleSheet, View } from 'react-native'
import Portal from './mpx-portal'
import { RouteContext } from './context'
import { getCustomEvent } from './getInnerListeners'

interface PageContainerProps {
  show?: boolean
  overlay?: boolean
  bindbeforeleave?: (event?: any) => void
  children?: ReactNode
}

const styles = StyleSheet.create({
  container: {
    position: 'absolute',
    top: 0,
    right: 0,
    bottom: 0,
    left: 0,
    zIndex: 100
  },
  overlay: {
    position: 'absolute',
    top: 0,
    right: 0,
    bottom: 0,
    left: 0,
    backgroundColor: 'rgba(0,0,0,0.6)'
  },
  content: {
    position: 'absolute',
    top: 0,
    right: 0,
    bottom: 0,
    left: 0
  }
})

const _PageContainer = (props: PageContainerProps) => {
  const { show = false, overlay = true, bindbeforeleave, children } = props
  const { navigation } = useContext(RouteContext) || {}
  const showRef = useRef(show)
  const propsRef = useRef(props)

  showRef.current = show
  propsRef.current = props

  useEffect(() => {
    if (!navigation?.addListener) return

    return navigation.addListener('beforeRemove', (e: any) => {
      if (!showRef.current) return

      e.preventDefault?.()
      propsRef.current.bindbeforeleave?.(
        getCustomEvent('beforeleave', e, { detail: {} }, propsRef.current)
      )
    })
  }, [navigation, bindbeforeleave])

  if (!show) return null

  return (
    <Portal>
      <View style={styles.container}>
        {overlay ? <View style={styles.overlay} /> : null}
        <View style={styles.content} pointerEvents='box-none'>
          {children}
        </View>
      </View>
    </Portal>
  )
}

_PageContainer.displayName = 'MpxPageContainer'

export default _PageContainer
