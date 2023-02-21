module.exports = function changeKey (input, srcKey, targetKey) {
  const value = input[srcKey]
  delete input[srcKey]
  input[targetKey] = value
  return input
}
