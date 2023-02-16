export const ease = {
  // easeOutQuint
  swipe: {
    fn: function (t) {
      return 1 + (--t * t * t * t * t)
    }
  },
  // easeOutQuard
  swipeBounce: {
    fn: function (t) {
      return t * (2 - t)
    }
  },
  // easeOutQuart
  easeInOutQuad: {
    fn: function (t) {
      if ((t /= 0.5) < 1) return 0.5 * Math.pow(t, 2)
      return -0.5 * ((t -= 2) * t - 2)
    }
  },
  easeInQuad: {
    fn: function (t) {
      return Math.pow(t, 2)
    }
  },
  easeInOutCubic: {
    fn: function (t) {
      if ((t /= 0.5) < 1) return 0.5 * Math.pow(t, 3)
      return 0.5 * (Math.pow((t - 2), 3) + 2)
    }
  }
}
