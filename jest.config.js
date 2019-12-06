module.exports = {
  transform: {
    '^.+\\.(js|jsx)?$': 'babel-jest'
  },
  moduleNameMapper: {
    '\\.(css|styl)$': 'identity-obj-proxy'
  },
  moduleFileExtensions: ['js', 'json']
}
