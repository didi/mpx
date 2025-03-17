
import { useLayoutEffect } from 'react'

export default function usePageLayoutEffect (navigation, pageConfig) {
  useLayoutEffect(() => {
    const isCustom = pageConfig.navigationStyle === 'custom'
    navigation.setOptions(
      Object.assign(
        {
          headerShown: !isCustom,
          title: pageConfig.navigationBarTitleText || '',
          headerStyle: {
            backgroundColor: pageConfig.navigationBarBackgroundColor || '#000000'
          },
          headerTintColor: pageConfig.navigationBarTextStyle || 'white',
          statusBarTranslucent: true
        },
        __mpx_mode__ === 'android'
          ? { statusBarStyle: pageConfig.statusBarStyle || 'light' }
          : {}
      )
    )
  }, [])
}
