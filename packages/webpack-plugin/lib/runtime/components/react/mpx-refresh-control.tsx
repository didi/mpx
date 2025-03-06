import React, { forwardRef } from 'react'
import { StyleSheet, View } from 'react-native'
import Animated, {
  useAnimatedStyle,
  SharedValue,
  runOnJS
} from 'react-native-reanimated'

interface CustomRefreshControlProps {
  refreshing: boolean;
  onRefresh: () => void;
  translateY: SharedValue<number>; // 直接使用共享值
  children?: React.ReactNode;
}

// 简化接口，不再需要 ref 方法
const MpxRefreshControl = forwardRef<View, CustomRefreshControlProps>(({
  refreshing,
  translateY,
  children
}, ref) => {
  // 直接使用传入的共享值
  const animatedStyle = useAnimatedStyle(() => {
    return {
      transform: [{ translateY: translateY.value }]
    };
  });
  
  return (
    <Animated.View
      ref={ref}
      style={[
        styles.container,
        animatedStyle
      ]}
    >
      <View style={styles.content}>
        {children}
      </View>
    </Animated.View>
  );
});

const styles = StyleSheet.create({
  container: {
    position: 'absolute',
    top: -60,
    left: 0,
    right: 0,
    height: 60,
    zIndex: 1
  },
  content: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'white'
  }
});

MpxRefreshControl.displayName = 'MpxRefreshControl';
export default MpxRefreshControl;