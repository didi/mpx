import { createStackNavigator } from '@react-navigation/stack'
import { NavigationContainer, StackActions } from '@react-navigation/native'
import PortalHost from '@mpxjs/webpack-plugin/lib/runtime/components/react/dist/mpx-portal/portal-host'
import { useHeaderHeight } from '@react-navigation/elements'
import { SafeAreaProvider, useSafeAreaInsets } from 'react-native-safe-area-context'
import { GestureHandlerRootView } from 'react-native-gesture-handler'

export {
  createStackNavigator,
  NavigationContainer,
  useHeaderHeight,
  StackActions,
  GestureHandlerRootView,
  PortalHost,
  SafeAreaProvider,
  useSafeAreaInsets
}
