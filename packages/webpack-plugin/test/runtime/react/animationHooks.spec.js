// Inline parseValues and pure parsing functions for isolated testing.
// Keep in sync with the actual implementation in animationHooks/useTransitionHooks.ts.

function parseValues (str, char = ' ') {
  let stack = 0
  let temp = ''
  const result = []
  for (let i = 0; i < str.length; i++) {
    if (str[i] === '(') {
      stack++
    } else if (str[i] === ')') {
      stack--
    }
    if (stack !== 0 || str[i] !== char) {
      temp += str[i]
    }
    if ((stack === 0 && str[i] === char) || i === str.length - 1) {
      result.push(temp.trim())
      temp = ''
    }
  }
  return result
}

function dash2hump (str) {
  return str.replace(/-(\w)/g, (_, c) => (c ? c.toUpperCase() : ''))
}

const propName = {
  transition: '',
  transitionDuration: 'duration',
  transitionProperty: 'property',
  transitionTimingFunction: 'easing',
  transitionDelay: 'delay'
}
const timingFunctionExp = /^(step-start|step-end|steps)/
const secondRegExp = /^\s*(\d*(?:\.\d+)?)(s|ms)?\s*$/
const cubicBezierExp = /cubic-bezier\(["']?(.*?)["']?\)/
const easingKey = {
  linear: 'linear',
  ease: 'ease',
  'ease-in': 'ease-in',
  'ease-in-out': 'ease-in-out',
  'ease-out': 'ease-out'
}

function getUnit (duration) {
  const match = secondRegExp.exec(duration)
  return match ? match[2] === 's' ? +match[1] * 1000 : +match[1] : 0
}

function parseTransitionSingleProp (vals, property) {
  let setDuration = false
  property = propName[property]
  return vals.map(val => {
    if (Object.keys(easingKey).includes(val) || cubicBezierExp.test(val)) {
      return { easing: val }
    }
    if (timingFunctionExp.test(val)) {
      return undefined
    }
    if (secondRegExp.test(val)) {
      const newProperty = property || (!setDuration ? 'duration' : 'delay')
      setDuration = true
      return {
        [newProperty]: getUnit(val)
      }
    }
    return {
      property: dash2hump(val)
    }
  }).filter(item => item !== undefined)
}

function parseTransitionStyle (originalStyle) {
  let transitionData = []
  Object.entries(originalStyle).filter(arr => arr[0].includes('transition')).forEach(([prop, value]) => {
    if (prop === 'transition') {
      const vals = parseValues(value, ',').map(item => {
        return parseTransitionSingleProp(parseValues(item), prop).reduce((map, subItem) => {
          return Object.assign(map, subItem)
        }, {})
      })
      if (transitionData.length) {
        transitionData = (vals.length > transitionData.length ? vals : transitionData).map((transitionItem, i) => {
          const valItem = vals[i] || {}
          const current = transitionData[i] || {}
          return Object.assign({}, current, valItem)
        })
      } else {
        transitionData = vals
      }
    } else {
      const vals = parseTransitionSingleProp(parseValues(value, ','), prop)
      if (transitionData.length) {
        transitionData = (vals.length > transitionData.length ? vals : transitionData).map((transitionItem, i) => {
          const valItem = vals[i] || vals[vals.length - 1]
          const current = transitionData[i] || transitionData[transitionData.length - 1]
          return Object.assign({}, current, valItem)
        })
      } else {
        transitionData = vals
      }
    }
  })
  const supportedProperties = [
    'color', 'borderColor', 'borderBottomColor', 'borderLeftColor', 'borderRightColor', 'borderTopColor',
    'borderTopLeftRadius', 'borderTopRightRadius', 'borderBottomLeftRadius', 'borderBottomRightRadius',
    'borderRadius', 'borderBottomWidth', 'borderLeftWidth', 'borderRightWidth', 'borderTopWidth', 'borderWidth',
    'margin', 'marginBottom', 'marginLeft', 'marginRight', 'marginTop', 'marginHorizontal', 'marginVertical',
    'maxHeight', 'maxWidth', 'minHeight', 'minWidth',
    'padding', 'paddingBottom', 'paddingLeft', 'paddingRight', 'paddingTop', 'paddingHorizontal', 'paddingVertical',
    'fontSize', 'letterSpacing',
    'opacity', 'backgroundColor',
    'width', 'height', 'top', 'right', 'bottom', 'left',
    'rotateX', 'rotateY', 'rotateZ', 'scaleX', 'scaleY', 'skewX', 'skewY', 'translateX', 'translateY',
    'transformOrigin', 'transform'
  ]
  const supportedPropertySet = new Set(supportedProperties)
  const transitionMap = transitionData.reduce((acc, cur) => {
    const { property = '', duration = 0, delay = 0, easing = 'ease' } = cur
    if ((supportedPropertySet.has(dash2hump(property)) || property === 'transform') && duration > 0) {
      acc[property] = { duration, delay, easing }
    }
    return acc
  }, {})
  return transitionMap
}

describe('useTransitionHooks - parseTransitionStyle', () => {
  describe('parseTransitionSingleProp', () => {
    it('should parse duration in seconds', () => {
      const result = parseTransitionSingleProp(['0.35s'], 'transitionDuration')
      expect(result).toEqual([{ duration: 350 }])
    })

    it('should parse duration in milliseconds', () => {
      const result = parseTransitionSingleProp(['350ms'], 'transitionDuration')
      expect(result).toEqual([{ duration: 350 }])
    })

    it('should parse property name', () => {
      const result = parseTransitionSingleProp(['transform'], 'transitionProperty')
      expect(result).toEqual([{ property: 'transform' }])
    })

    it('should parse easing name', () => {
      const result = parseTransitionSingleProp(['ease-in-out'], 'transitionTimingFunction')
      expect(result).toEqual([{ easing: 'ease-in-out' }])
    })

    it('should parse cubic-bezier easing', () => {
      const result = parseTransitionSingleProp(['cubic-bezier(0.25, 0.1, 0.25, 1.0)'], 'transitionTimingFunction')
      expect(result).toEqual([{ easing: 'cubic-bezier(0.25, 0.1, 0.25, 1.0)' }])
    })

    it('should mark step timing functions as unsupported', () => {
      const result = parseTransitionSingleProp(['step-start'], 'transitionTimingFunction')
      expect(result).toEqual([])
    })

    it('should parse delay values when property is transitionDelay', () => {
      // propName['transitionDelay'] === 'delay', so all time values map to delay
      const result = parseTransitionSingleProp(['0.35s', '0.1s'], 'transitionDelay')
      expect(result).toEqual([{ delay: 350 }, { delay: 100 }])
    })

    it('should parse combined duration and property from shorthand', () => {
      const result = parseTransitionSingleProp(['0.35s', 'ease-in-out', 'transform'], 'transition')
      expect(result).toHaveLength(3)
      const merged = result.reduce((map, subItem) => Object.assign(map, subItem), {})
      expect(merged).toMatchObject({ duration: 350, easing: 'ease-in-out', property: 'transform' })
    })
  })

  describe('parseTransitionStyle', () => {
    it('should parse transition shorthand with all values', () => {
      const style = {
        transition: 'transform 0.35s ease-in-out'
      }
      const result = parseTransitionStyle(style)
      expect(result).toHaveProperty('transform')
      expect(result.transform.duration).toBe(350)
      expect(result.transform.easing).toBe('ease-in-out')
    })

    it('should parse transition-property and transition-duration separately', () => {
      const style = {
        transitionProperty: 'transform',
        transitionDuration: '0.7s'
      }
      const result = parseTransitionStyle(style)
      expect(result).toHaveProperty('transform')
      expect(result.transform.duration).toBe(700)
    })

    it('should parse transition-duration as 0 (zero)', () => {
      const style = {
        transition: 'transform 0.35s ease-in-out',
        transitionDuration: '0'
      }
      const result = parseTransitionStyle(style)
      // duration 0 should not be included in transitionMap
      expect(result).toEqual({})
    })

    it('should update duration when transition-duration changes', () => {
      const initialStyle = {
        transition: 'transform 0.35s ease-in-out'
      }
      const result1 = parseTransitionStyle(initialStyle)
      expect(result1.transform.duration).toBe(350)

      const updatedStyle = {
        transition: 'transform 0.7s ease-in-out'
      }
      const result2 = parseTransitionStyle(updatedStyle)
      expect(result2.transform.duration).toBe(700)
    })

    it('should update duration when transition-duration is changed separately', () => {
      const initialStyle = {
        transitionProperty: 'transform',
        transitionDuration: '0.35s'
      }
      const result1 = parseTransitionStyle(initialStyle)
      expect(result1.transform.duration).toBe(350)

      const updatedStyle = {
        transitionProperty: 'transform',
        transitionDuration: '0.7s'
      }
      const result2 = parseTransitionStyle(updatedStyle)
      expect(result2.transform.duration).toBe(700)
    })

    it('should switch duration between 0 and non-zero', () => {
      const enabledStyle = {
        transition: 'transform 0.35s ease-in-out'
      }
      expect(parseTransitionStyle(enabledStyle).transform.duration).toBe(350)

      const disabledStyle = {
        transition: 'transform 0s ease-in-out'
      }
      expect(parseTransitionStyle(disabledStyle)).toEqual({})
    })

    it('should handle dynamic enable/disable via separate transition-duration', () => {
      const enabledStyle = {
        transitionProperty: 'transform',
        transitionDuration: '0.35s',
        transitionTimingFunction: 'ease-in-out'
      }
      const result1 = parseTransitionStyle(enabledStyle)
      expect(result1.transform.duration).toBe(350)

      const disabledStyle = {
        transitionProperty: 'transform',
        transitionDuration: '0',
        transitionTimingFunction: 'ease-in-out'
      }
      const result2 = parseTransitionStyle(disabledStyle)
      expect(result2).toEqual({})
    })

    it('should preserve easing when duration changes', () => {
      const style1 = {
        transition: 'transform 0.35s ease-in-out'
      }
      const style2 = {
        transition: 'transform 0.7s ease-in-out'
      }
      const style3 = {
        transition: 'transform 1.2s linear'
      }

      expect(parseTransitionStyle(style1).transform.easing).toBe('ease-in-out')
      expect(parseTransitionStyle(style2).transform.easing).toBe('ease-in-out')
      expect(parseTransitionStyle(style3).transform.easing).toBe('linear')
    })

    it('should handle multiple transition properties', () => {
      const style = {
        transition: 'opacity 0.3s ease, transform 0.5s ease-in-out'
      }
      const result = parseTransitionStyle(style)
      expect(result.opacity.duration).toBe(300)
      expect(result.transform.duration).toBe(500)
    })

    it('should parse non-shorthand transition properties in order', () => {
      const style = {
        transitionProperty: 'transform',
        transitionDuration: '0.35s',
        transitionTimingFunction: 'ease-in-out',
        transitionDelay: '0.1s'
      }
      const result = parseTransitionStyle(style)
      expect(result.transform).toEqual({
        duration: 350,
        delay: 100,
        easing: 'ease-in-out'
      })
    })

    it('should handle margin transition', () => {
      const style = {
        transition: 'marginLeft 0.3s ease'
      }
      const result = parseTransitionStyle(style)
      expect(result.marginLeft.duration).toBe(300)
    })

    it('should handle opacity transition', () => {
      const style = {
        transition: 'opacity 0.25s ease-out'
      }
      const result = parseTransitionStyle(style)
      expect(result.opacity.duration).toBe(250)
      expect(result.opacity.easing).toBe('ease-out')
    })

    it('should handle width and height transitions', () => {
      const style = {
        transition: 'width 0.4s linear, height 0.6s ease'
      }
      const result = parseTransitionStyle(style)
      expect(result.width.duration).toBe(400)
      expect(result.height.duration).toBe(600)
    })

    it('should return empty object when no valid transition exists', () => {
      const style = {
        transition: 'transform step-start'
      }
      const result = parseTransitionStyle(style)
      expect(result).toEqual({})
    })

    it('should not include transition with duration 0 in result', () => {
      const style = {
        transition: 'transform 0s ease-in-out'
      }
      const result = parseTransitionStyle(style)
      expect(result).toEqual({})
    })

    it('should re-parse and return new object on each call with different style', () => {
      const style1 = { transition: 'transform 0.35s ease-in-out' }
      const style2 = { transition: 'transform 0.7s ease-in-out' }
      const result1 = parseTransitionStyle(style1)
      const result2 = parseTransitionStyle(style2)
      expect(result1).not.toBe(result2)
      expect(result1.transform.duration).toBe(350)
      expect(result2.transform.duration).toBe(700)
    })
  })

  describe('dynamic transition-duration update scenarios', () => {
    it('scenario: toggle transition on/off by switching duration between 0 and non-zero', () => {
      const onStyle = {
        transition: 'transform 0.35s ease-in-out'
      }
      const offStyle = {
        transition: 'transform 0s ease-in-out'
      }
      expect(parseTransitionStyle(onStyle).transform.duration).toBe(350)
      expect(parseTransitionStyle(offStyle)).toEqual({})
    })

    it('scenario: computed style switching between 0.35s and 0.7s duration', () => {
      const fastStyle = {
        transition: 'transform 0.35s ease-in-out'
      }
      const slowStyle = {
        transition: 'transform 0.7s ease-in-out'
      }
      expect(parseTransitionStyle(fastStyle).transform.duration).toBe(350)
      expect(parseTransitionStyle(slowStyle).transform.duration).toBe(700)
    })

    it('scenario: computed style with transition-duration string "0" disables transition', () => {
      const enabledStyle = {
        transition: 'transform 0.35s ease-in-out',
        transitionDuration: '0.7s'
      }
      const disabledStyle = {
        transition: 'transform 0.35s ease-in-out',
        transitionDuration: '0'
      }
      expect(parseTransitionStyle(enabledStyle).transform.duration).toBe(700)
      expect(parseTransitionStyle(disabledStyle)).toEqual({})
    })

    it('scenario: separate transition-duration override with longer duration', () => {
      const style1 = {
        transition: 'transform 0.35s ease-in-out',
        transitionDuration: '1.2s'
      }
      const style2 = {
        transition: 'transform 0.35s ease-in-out',
        transitionDuration: '2s'
      }
      expect(parseTransitionStyle(style1).transform.duration).toBe(1200)
      expect(parseTransitionStyle(style2).transform.duration).toBe(2000)
    })

    it('scenario: separate transition-duration override with string "0" disables transition', () => {
      const enabledStyle = {
        transition: 'transform 0.35s ease-in-out',
        transitionDuration: '0.7s'
      }
      const disabledStyle = {
        transition: 'transform 0.35s ease-in-out',
        transitionDuration: '0'
      }
      expect(parseTransitionStyle(enabledStyle).transform.duration).toBe(700)
      expect(parseTransitionStyle(disabledStyle)).toEqual({})
    })
  })

  describe('delay and easing dynamic update', () => {
    it('should parse and update delay via separate transition-delay', () => {
      const style1 = {
        transitionProperty: 'transform',
        transitionDuration: '0.35s',
        transitionTimingFunction: 'ease-in-out',
        transitionDelay: '0.1s'
      }
      const result1 = parseTransitionStyle(style1)
      expect(result1.transform).toEqual({
        duration: 350,
        delay: 100,
        easing: 'ease-in-out'
      })

      const style2 = {
        transitionProperty: 'transform',
        transitionDuration: '0.35s',
        transitionTimingFunction: 'ease-in-out',
        transitionDelay: '0.5s'
      }
      const result2 = parseTransitionStyle(style2)
      expect(result2.transform.delay).toBe(500)
    })

    it('should parse and update easing via separate transition-timing-function', () => {
      const style1 = {
        transitionProperty: 'transform',
        transitionDuration: '0.35s',
        transitionTimingFunction: 'linear'
      }
      const result1 = parseTransitionStyle(style1)
      expect(result1.transform.easing).toBe('linear')

      const style2 = {
        transitionProperty: 'transform',
        transitionDuration: '0.35s',
        transitionTimingFunction: 'ease-out'
      }
      const result2 = parseTransitionStyle(style2)
      expect(result2.transform.easing).toBe('ease-out')
    })

    it('should switch easing between named and cubic-bezier', () => {
      const easeStyle = {
        transition: 'transform 0.35s ease-in-out'
      }
      expect(parseTransitionStyle(easeStyle).transform.easing).toBe('ease-in-out')

      const cubicStyle = {
        transition: 'transform 0.35s cubic-bezier(0.42, 0, 0.58, 1)'
      }
      const cubicResult = parseTransitionStyle(cubicStyle)
      expect(cubicResult.transform.easing).toBe('cubic-bezier(0.42, 0, 0.58, 1)')
    })

    it('should override shorthand easing with separate transition-timing-function', () => {
      const style1 = {
        transition: 'transform 0.35s linear',
        transitionTimingFunction: 'ease-in-out'
      }
      expect(parseTransitionStyle(style1).transform.easing).toBe('ease-in-out')

      const style2 = {
        transition: 'transform 0.35s ease-in-out',
        transitionTimingFunction: 'linear'
      }
      expect(parseTransitionStyle(style2).transform.easing).toBe('linear')
    })

    it('should override shorthand delay with separate transition-delay', () => {
      const style1 = {
        transition: 'transform 0.35s 0.1s linear',
        transitionDelay: '0.5s'
      }
      expect(parseTransitionStyle(style1).transform.delay).toBe(500)
    })
  })

  describe('backgroundColor transition', () => {
    it('should parse backgroundColor from shorthand', () => {
      const style = {
        transition: 'backgroundColor 0.3s ease-out'
      }
      const result = parseTransitionStyle(style)
      expect(result.backgroundColor.duration).toBe(300)
      expect(result.backgroundColor.easing).toBe('ease-out')
    })

    it('should parse backgroundColor with separate properties', () => {
      const style = {
        transitionProperty: 'backgroundColor',
        transitionDuration: '0.5s',
        transitionTimingFunction: 'ease'
      }
      const result = parseTransitionStyle(style)
      expect(result.backgroundColor.duration).toBe(500)
      expect(result.backgroundColor.easing).toBe('ease')
    })
  })

  describe('transform sub-properties', () => {
    it('should parse rotateX via transform shorthand', () => {
      const style = {
        transition: 'transform 0.4s ease-in-out'
      }
      const result = parseTransitionStyle(style)
      expect(result.transform.duration).toBe(400)
      expect(result.transform.easing).toBe('ease-in-out')
    })

    it('should parse rotateY via transform shorthand', () => {
      const style = {
        transition: 'transform 0.5s ease-out'
      }
      const result = parseTransitionStyle(style)
      expect(result.transform.duration).toBe(500)
    })

    it('should parse rotateZ via transform shorthand', () => {
      const style = {
        transition: 'transform 0.35s linear'
      }
      const result = parseTransitionStyle(style)
      expect(result.transform.duration).toBe(350)
      expect(result.transform.easing).toBe('linear')
    })

    it('should parse scaleX via transform shorthand', () => {
      const style = {
        transition: 'transform 0.3s ease-in-out'
      }
      const result = parseTransitionStyle(style)
      expect(result.transform.duration).toBe(300)
    })

    it('should parse scaleY via transform shorthand', () => {
      const style = {
        transition: 'transform 0.4s ease-in-out'
      }
      const result = parseTransitionStyle(style)
      expect(result.transform.duration).toBe(400)
    })

    it('should parse skewX via transform shorthand', () => {
      const style = {
        transition: 'transform 0.25s ease-out'
      }
      const result = parseTransitionStyle(style)
      expect(result.transform.duration).toBe(250)
    })

    it('should parse skewY via transform shorthand', () => {
      const style = {
        transition: 'transform 0.25s ease-in-out'
      }
      const result = parseTransitionStyle(style)
      expect(result.transform.duration).toBe(250)
    })

    it('should parse translateX via transform shorthand', () => {
      const style = {
        transition: 'transform 0.5s ease'
      }
      const result = parseTransitionStyle(style)
      expect(result.transform.duration).toBe(500)
    })

    it('should parse translateY via transform shorthand', () => {
      const style = {
        transition: 'transform 0.5s ease'
      }
      const result = parseTransitionStyle(style)
      expect(result.transform.duration).toBe(500)
    })

    it('should update duration for transform when using separate transition-duration', () => {
      const style1 = {
        transitionProperty: 'transform',
        transitionDuration: '0.35s',
        transitionTimingFunction: 'ease-in-out'
      }
      const result1 = parseTransitionStyle(style1)
      expect(result1.transform.duration).toBe(350)

      const style2 = {
        transitionProperty: 'transform',
        transitionDuration: '0.8s',
        transitionTimingFunction: 'linear'
      }
      const result2 = parseTransitionStyle(style2)
      expect(result2.transform.duration).toBe(800)
      expect(result2.transform.easing).toBe('linear')
    })
  })

  describe('opacity transition', () => {
    it('should parse opacity from shorthand', () => {
      const style = {
        transition: 'opacity 0.25s ease-out'
      }
      const result = parseTransitionStyle(style)
      expect(result.opacity.duration).toBe(250)
      expect(result.opacity.easing).toBe('ease-out')
    })

    it('should parse opacity with delay', () => {
      const style = {
        transition: 'opacity 0.3s 0.1s ease-in-out'
      }
      const result = parseTransitionStyle(style)
      expect(result.opacity.duration).toBe(300)
      expect(result.opacity.delay).toBe(100)
    })
  })

  describe('combined opacity + transform transition', () => {
    it('should parse both opacity and transform with different timings', () => {
      const style = {
        transition: 'opacity 0.3s ease, transform 0.5s ease-in-out'
      }
      const result = parseTransitionStyle(style)
      expect(result.opacity.duration).toBe(300)
      expect(result.transform.duration).toBe(500)
    })

    it('should parse combined transition with backgroundColor', () => {
      const style = {
        transition: 'opacity 0.2s ease, backgroundColor 0.4s ease-out, transform 0.6s linear'
      }
      const result = parseTransitionStyle(style)
      expect(result.opacity.duration).toBe(200)
      expect(result.backgroundColor.duration).toBe(400)
      expect(result.transform.duration).toBe(600)
    })

    it('should handle shorthand transition overriding separate properties', () => {
      const style = {
        transitionProperty: 'opacity, transform',
        transitionDuration: '0.3s, 0.5s',
        transitionTimingFunction: 'ease, linear',
        transition: 'opacity 0.7s ease-in-out, transform 0.8s ease-out'
      }
      const result = parseTransitionStyle(style)
      // separate properties come first, shorthand comes later and overrides
      expect(result.opacity.duration).toBe(700)
      expect(result.opacity.easing).toBe('ease-in-out')
      expect(result.transform.duration).toBe(800)
      expect(result.transform.easing).toBe('ease-out')
    })
  })

  describe('duration/delay/easing override precedence', () => {
    it('separate transition-duration should override shorthand duration', () => {
      const style = {
        transition: 'transform 0.35s ease-in-out',
        transitionDuration: '1s'
      }
      const result = parseTransitionStyle(style)
      expect(result.transform.duration).toBe(1000)
    })

    it('separate transition-delay should override shorthand delay', () => {
      const style = {
        transition: 'transform 0.35s 0.1s ease-in-out',
        transitionDelay: '0.5s'
      }
      const result = parseTransitionStyle(style)
      expect(result.transform.delay).toBe(500)
    })

    it('separate transition-timing-function should override shorthand easing', () => {
      const style = {
        transition: 'transform 0.35s ease-in-out',
        transitionTimingFunction: 'linear'
      }
      const result = parseTransitionStyle(style)
      expect(result.transform.easing).toBe('linear')
    })

    it('all separate properties should override shorthand completely', () => {
      const shorthandOnly = {
        transition: 'transform 0.35s 0.1s ease-in-out'
      }
      const separateOverrides = {
        transition: 'transform 0.35s 0.1s ease-in-out',
        transitionDuration: '0.7s',
        transitionDelay: '0.3s',
        transitionTimingFunction: 'linear'
      }
      const shorthandResult = parseTransitionStyle(shorthandOnly)
      const overrideResult = parseTransitionStyle(separateOverrides)
      expect(overrideResult.transform.duration).not.toBe(shorthandResult.transform.duration)
      expect(overrideResult.transform.delay).not.toBe(shorthandResult.transform.delay)
      expect(overrideResult.transform.easing).not.toBe(shorthandResult.transform.easing)
      expect(overrideResult.transform.duration).toBe(700)
      expect(overrideResult.transform.delay).toBe(300)
      expect(overrideResult.transform.easing).toBe('linear')
    })
  })

  describe('edge cases for duration/delay/easing', () => {
    it('should handle duration in milliseconds string', () => {
      const style = {
        transition: 'transform 500ms ease'
      }
      const result = parseTransitionStyle(style)
      expect(result.transform.duration).toBe(500)
    })

    it('should handle duration with decimal seconds', () => {
      const style = {
        transition: 'transform 0.123s ease'
      }
      const result = parseTransitionStyle(style)
      expect(result.transform.duration).toBe(123)
    })

    it('should handle delay with decimal seconds', () => {
      const style = {
        transition: 'transform 0.35s 0.25s ease'
      }
      const result = parseTransitionStyle(style)
      expect(result.transform.duration).toBe(350)
      expect(result.transform.delay).toBe(250)
    })

    it('should handle all five easing names', () => {
      const easings = ['linear', 'ease', 'ease-in', 'ease-out', 'ease-in-out']
      easings.forEach(easing => {
        const style = {
          transition: `transform 0.35s ${easing}`
        }
        const result = parseTransitionStyle(style)
        expect(result.transform.easing).toBe(easing)
      })
    })

    it('should handle cubic-bezier with various values', () => {
      const style = {
        transition: 'transform 0.35s cubic-bezier(0, 0, 1, 1)'
      }
      const result = parseTransitionStyle(style)
      expect(result.transform.easing).toBe('cubic-bezier(0, 0, 1, 1)')
    })
  })
})
