import React, { useEffect, useMemo, useRef, useState, ReactNode, useCallback } from 'react'
import {
  TouchableWithoutFeedback,
  View,
  Text,
  StyleSheet,
  StyleProp,
  ViewStyle,
  TextStyle,
  Animated,
  Easing,
} from 'react-native'
import { extracteTextStyle } from '../utils'

export interface ButtonProps {
  size?: string
  type?: Type
  plain?: boolean
  disabled?: boolean
  loading?: boolean
  hoverStyle?: StyleProp<ViewStyle & TextStyle>
  hoverStartTime?: number
  hoverStayTime?: number
  style?: StyleProp<ViewStyle & TextStyle>
  children: ReactNode
  onTap?: () => void
}

export type Type = 'default' | 'primary' | 'warn'

/**
 * normal、hover、plain、disabled
 */
type TypeColor = [string, string, string, string]

const LoadingImageUri =
  'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAGQAAABkCAYAAABw4pVUAAAAAXNSR0IB2cksfwAAAAlwSFlzAAALEwAACxMBAJqcGAAAB8hJREFUeJztnVtsFFUch6ltUYrEAi0Qo40xChGM+oAGI0EEKl4QfDVI9AkqqQZ4IVA1RSIvJlwUWwqJUokGKMVYwHJTq4mGuA+SxpJYggJSSgMpVFOtvbh+J84mk+3smXN2znZm2fNLvoQH5uQ/v4+Z2Z3dHUaNsrGxsbGxsbGxsbGxsbGxsTGSrq6uUqiHqw7iz6Vhz5WzofwYxJP4Mey5cjIUX+4hI0F52PPlXCi9WiKkOuz5ci5WiMFcvHhxOXRCHPpgLdyis4ZJITtqagtgPfRBHH6HV3XWyNpQ/DxHRDJbddYxLKTGEZHMLK2dy8ZQ/O4UQgQzVdcxJYTSZ6aQIfggrZ3MplD6CYmQmOo6BoXEJEK+TGsnsymUXicRIlimso4JIRS+TCJDsD3QzmZDKHwqDEmEdECR3zpBhVB2EVyWyBiC+4zsdNRD4Vt8jpJ3/dYwIGSTz9Gx2cjOZkMofBx0S4SIl8JlsjWCCKHsMuiXyOiGcUZ3Ouqh8BU+R0mjbPuAQg76HB3Lje5sNoTC86DNR8qcVNunK4Sy5/jIaIO8jOx01CMK9xEihHmWk44Qis53CpcJSfmPICdC4Q0+Ul7z2i5NISt9ZOzP6M5mQ8TF27mIpxIiLv7DLrC6t9/FRdq5WKeSIe5jSV9IZEXa29sfgC+gBXbBJN01KPwdn6PkLa/tKP6Uh4xvvP4uZW/wOTo26M69q27nZPgIWqARpumuYTSU/zT0Q9xFL6yFQtV1KHyM6+6vF4e9tuvS+AiXwo9JZIg3iGNU56X4QlgPvRB30QdPqa5jNBSeBxeSZLg5B0tU16P0pRIhnwadl8L3SoS8pLoOhS+Bc0ki3JwNOmtaoeyJEhluTojTmsqaFP99CiGzg85L6QtTyGhR2Z6ip8PXEhFuioPOqx1Kvg3+VZQyBLUwXrYmxU+Bky4Rl+BlUzNTfgV0umSI01iJbBvKnQC1MKQoY0Cc0kzNrBUK3qMoJEE3VEK+bF0kPA4PZmpuJDwCj8n+DqXmQyX0KIpIUJepuX1DsXfAPk0pgp8hnIufQih1AZzRFCH4DHzvVGc8lDsbWtMQ0yikhj1/IuLc77x81RXRCoGvc0ZDsbdAhXNa0pGyO+zZE6HUfZoirkEFaH1BY0TjnMa2wKCikL9hdNhzU+pYjQv3ILwH2XOLnpKnQrOilDvDnpdy71KU0QT3hz1v2qHsRXBWIuOSON2FPafzqqpD9oYPFoY9p5FQeAGsgRtJMgbgubDnS4TCFzmnI7eI6/AGFIQ9n/FQfimsgsNwEGaEPVNyKP5h57R0GF6HiWHPZGNjY2NjYzytra2FsBiqoFqTKmfbcO6EppE99Z8UwmKogmpNqpxtM7O/FFkMpyEeELHGyH9eoBmKLIbTEA+IWMP8/lLiNgMyEmwxPqDhUOI2AzISmN9fSrxiUMh54wMaDiVeMSjkvPEBrZDoCanNsVNWbdRPWSUGL+q3Gx/QcCixxOBFPTP722pf9kbnZa+NjY2NjU2YicViJbADWqAJpoc9U3Ia9u1/CA5BC+wA6TcbszIUXwCr4QbEXQzAM2HPlwjlvwCDEHdxHVbDzfERLoU/D+1JItxchtC/5EDh+XA5SYabXyB7n8NFyVOhWSLCTehfA6LsuyUy3ByB7PkaEOUWw/swqChDEPoXzii5WFFI3DmtbYbIfA12WMRpByrgmoYIwZ6wZ0+Eghs1pAiuQQVE62fUlPoktGqKEDRE4ehIhGLHw0FNKYKf4Imw5xcixsHeNES0wfyw508Vyl0AZ9IQsxfGhjY4pX6sKaIbKkH6g53vWr6dBXNB+xe9fmlqapoEc0H6tDjnVVcl9GhKqTE9s1IodbTzPkJFxBBsB+lFEAFT4CTEHXrgFVMzI2E59ELc4ShI3/hR8ATYDkOKQnpMzasVyp2oKONETPEdOeX/4JLhJvCzDyl+vkuEmxaV7Sl6BnylKEX6W8qMhJLz4DeJiF9B+WfRlL40hQzBh0Hnpfj6FEIES1XXoewX4YJERjg/ixah8HKP09YfsAaUP5ih8CLokAg55LXd8aPHSqEerjqIP3s+OIDSmyVCOkD5t4GUfiusg94kGf0wT3WdjEScjuBzOAKrQPtCTOEbJTIEb3ttR/kxiCfh+ex3Ct8gESLYqDs35U9u+P8+l3j3fgDCfbSGiVB2GfRJZHTDsPcqFF/uISPBsHtOFD4euiVC+iD7Hz4TNJR9wOfo8Hw8E6VXS4RUe21D4St9jpKGjO5s1EPZc3xktIHnbYk0heRDm4+U3HyAmSjaKVwmJGU56QgREYX7CBHConVvaiRC2RU+MqQPwUxXiAiFH/SRssLozkY94iLtXKxTyRAXeekFNqCQMuiXCBEX/8jc9Mx4KHurz9Hh+yDlIEJEKHyTz1GSGw9SpuxpMCCR0SneKPqtY0BIEXRKhIgj6F4jOx3lUHadz9Gh9DD+oEJEKHyZz1Fy8z+Mn8KPS2Qo/3cVJoSIUHpMIqQ5rZ3MplD6TokQ5f/QxaCQRyVCAt/UjHyca4jXrRKt/83GlBARiq/xkPEn3KOzTtaG8p+FLkfEX7AOtL6bZVhIAbwJ/zgyLkFkP2KOZEwKsTEQKyRi0b39bjMCofhTHjI8n/1uMwI5rvERro2NjY2NjY2NjY2NjY2NjY1+/gNWA2LIOT/TRAAAAABJRU5ErkJggg=='

const TypeColorMap: Record<Type, TypeColor> = {
  default: ['#F8F8F8', '#DEDEDE', '35,35,35', '#F7F7F7'],
  primary: ['#1AAD19', '#179B16', '26,173,25', '#9ED99D'],
  warn: ['#E64340', '#CE3C39', '230,67,64', '#EC8B89'],
}

const styles = StyleSheet.create({
  button: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 14,
    marginVertical: 14,
    height: 46,
    borderRadius: 5,
    backgroundColor: '#F8F8F8',
  },
  buttonMini: {
    height: 30,
  },
  text: {
    fontSize: 18,
    color: '#000000',
  },
  textMini: {
    fontSize: 13,
  },
  loading: {
    width: 20,
    height: 20,
  },
})

const Loading = ({ alone = false }: { alone: boolean }): React.JSX.Element => {
  const image = useRef(new Animated.Value(0)).current

  const rotate = image.interpolate({
    inputRange: [0, 1],
    outputRange: ['0deg', '360deg'],
  })

  useEffect(() => {
    const animation = Animated.loop(
      Animated.timing(image, {
        toValue: 1,
        duration: 1000,
        easing: Easing.linear,
        useNativeDriver: true,
        isInteraction: false,
      })
    )

    animation.start()

    return () => {
      animation.stop()
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  const loadingStyle = {
    ...styles.loading,
    transform: [{ rotate }],
    marginRight: alone ? 0 : 5,
  }

  return <Animated.Image testID="loading" style={loadingStyle} source={{ uri: LoadingImageUri }} />
}

const Button = (props: ButtonProps): React.JSX.Element => {
  const {
    size = 'default',
    type = 'default',
    plain = false,
    disabled = false,
    loading = false,
    hoverStyle = {},
    hoverStartTime = 20,
    hoverStayTime = 70,
    style = {},
    children,
    onTap = () => {},
  } = props

  const ref = useRef<{
    preseeInTimer: ReturnType<typeof setTimeout> | undefined
    preseeOutTimer: ReturnType<typeof setTimeout> | undefined
    isPressEnd: boolean
  }>({
    preseeInTimer: undefined,
    preseeOutTimer: undefined,
    isPressEnd: false,
  })

  const [isHover, setHover] = useState(false)

  const isMiniSize = size === 'mini'

  const textStyle = extracteTextStyle(style)

  const textHoverStyle = isHover ? extracteTextStyle(hoverStyle) : {}

  const { viewStyle: presetViewStyle, textStyle: presetTextStyle } = useMemo<{
    viewStyle: ViewStyle
    textStyle: TextStyle
  }>(() => {
    const [color, hoverColor, plainColor, disabledColor] = TypeColorMap[type]
    const normalBackgroundColor = disabled ? disabledColor : isHover || loading ? hoverColor : color
    const plainBorderColor = disabled ? 'rgba(0, 0, 0, .2)' : isHover ? `rgba(${plainColor},.6)` : `rgb(${plainColor})`
    const normalBorderColor = type === 'default' ? 'rgba(0, 0, 0, .2)' : normalBackgroundColor
    const plainTextColor = disabled ? 'rgba(0, 0, 0, .2)' : isHover ? `rgba(${plainColor}, .6)` : `rgb(${plainColor})`
    const normalTextColor =
      type === 'default'
        ? `rgba(0, 0, 0, ${disabled ? 0.3 : isHover || loading ? 0.6 : 1})`
        : `rgba(255 ,255 ,255 , ${disabled || isHover || loading ? 0.6 : 1})`

    return {
      viewStyle: {
        borderWidth: 1,
        borderStyle: 'solid',
        borderColor: plain ? plainBorderColor : normalBorderColor,
        backgroundColor: plain ? 'transparent' : normalBackgroundColor,
      },
      textStyle: {
        color: plain ? plainTextColor : normalTextColor,
      },
    }
  }, [type, plain, isHover, loading, disabled])

  const stopHover = useCallback(() => {
    ref.current.preseeOutTimer = setTimeout(() => {
      setHover(false)
      clearTimeout(ref.current.preseeOutTimer)
    }, hoverStayTime)
  }, [hoverStayTime])

  const onPressIn = () => {
    ref.current.isPressEnd = false
    ref.current.preseeInTimer = setTimeout(() => {
      setHover(true)
      clearTimeout(ref.current.preseeInTimer)
    }, hoverStartTime)
  }

  const onPressOut = () => {
    ref.current.isPressEnd = true
    stopHover()
  }

  const onPress = () => {
    !disabled && onTap()
  }

  useEffect(() => {
    isHover && ref.current.isPressEnd && stopHover()
  }, [isHover, stopHover])

  return (
    <TouchableWithoutFeedback
      testID="button"
      accessibilityRole="button"
      onPress={onPress}
      onLongPress={onPress}
      onPressIn={onPressIn}
      onPressOut={onPressOut}
      disabled={disabled}>
      <View style={[styles.button, isMiniSize && styles.buttonMini, presetViewStyle, style, isHover && hoverStyle]}>
        {loading && <Loading alone={!React.Children.count(children)} />}
        {['string', 'number'].includes(typeof children) ? (
          <Text style={[styles.text, isMiniSize && styles.textMini, presetTextStyle, textStyle, textHoverStyle]}>
            {children}
          </Text>
        ) : (
          children
        )}
      </View>
    </TouchableWithoutFeedback>
  )
}

export default Button
