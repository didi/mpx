package com.reactnativeproject

import com.facebook.react.ReactActivity
import com.facebook.react.defaults.DefaultReactActivityDelegate

class MainActivity : ReactActivity() {
    override fun getMainComponentName(): String = "ReactNativeProject"

    override fun createReactActivityDelegate() =
        DefaultReactActivityDelegate(
            this,
            mainComponentName, // 第2个参数是 String（组件名）
            BuildConfig.IS_NEW_ARCHITECTURE_ENABLED // 第3个参数是 Boolean
        )
}
