import { createNativeStackNavigator as createStackNavigator } from '@react-navigation/native-stack'
import { NavigationContainer, StackActions } from '@react-navigation/native'
import PortalHost from '@mpxjs/webpack-plugin/lib/runtime/components/react/dist/mpx-portal/portal-host'
import { useHeaderHeight } from '@react-navigation/elements'
import { SafeAreaProvider, useSafeAreaInsets } from 'react-native-safe-area-context'
import { GestureHandlerRootView } from 'react-native-gesture-handler'

global.__navigationHelper = {
  createStackNavigator,
  NavigationContainer,
  useHeaderHeight,
  StackActions,
  GestureHandlerRootView,
  PortalHost,
  SafeAreaProvider,
  useSafeAreaInsets
}

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
